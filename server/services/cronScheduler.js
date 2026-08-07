import cron from 'node-cron';
import db from '../config/db.js';
import TaskModel from '../models/taskModel.js';
import { sendTaskReminderEmail } from './emailService.js';

/**
 * Normalizes a date into YYYY-MM-DD format based on local time.
 * Helps with occurrence_date matching.
 */
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  return dateStr;
}

/**
 * Converts a HH:MM:SS or HH:MM string and a YYYY-MM-DD string into a valid local Date object.
 */
function parseDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  // Months are 0-indexed in JS Date
  return new Date(year, month - 1, day, hour, minute, 0);
}

/**
 * Main check loop.
 * Evaluates active tasks with due times and checks if they need an email reminder.
 */
async function checkReminders() {
  try {
    // 1. Fetch all users so we have their emails.
    const [users] = await db.execute('SELECT id, name, email FROM users');
    if (!users || users.length === 0) return;

    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    // 2. We will check upcoming occurrences dynamically.
    // To do this efficiently, we iterate over users.
    const now = new Date();
    
    for (const user of users) {
      // Get all tasks (including recurring occurrences) for this user from today to tomorrow.
      const todayStr = new Date(now.getTime()).toISOString().split('T')[0];
      const tomorrowStr = new Date(now.getTime() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0];
      
      const tasks = await TaskModel.getAllByUser(user.id, todayStr, tomorrowStr);
      
      // Filter out completed tasks and tasks without time.
      const activeTimedTasks = tasks.filter(t => !t.completed && t.dueDate && t.dueTime);

      for (const task of activeTimedTasks) {
        const taskDateTime = parseDateTime(task.dueDate, task.dueTime);
        if (!taskDateTime) continue;

        const timeDiffMinutes = (taskDateTime.getTime() - now.getTime()) / (1000 * 60);
        const occurrenceDate = normalizeDate(task.dueDate);
        const parentTaskId = task.isOccurrence ? task.parentTaskId : task.id;

        // 3. Determine if it qualifies for any trigger
        let triggerType = null;
        let subject = '';

        if (timeDiffMinutes > 0 && timeDiffMinutes <= 30) {
          triggerType = '30min';
          subject = `Reminder: Task "${task.title}" is due in 30 minutes!`;
        } else if (timeDiffMinutes > 1410 && timeDiffMinutes <= 1440) { // 23.5 - 24 hours away
          triggerType = '1day';
          subject = `Reminder: Task "${task.title}" is due tomorrow!`;
        } else if (timeDiffMinutes < 0 && timeDiffMinutes >= -30) { // Up to 30 mins late
          triggerType = 'overdue';
          subject = `Overdue: Task "${task.title}" was due recently!`;
        }

        if (triggerType) {
          // Check if already sent
          const [logs] = await db.execute(
            'SELECT id FROM email_reminders_log WHERE task_id = ? AND occurrence_date = ? AND reminder_type = ? LIMIT 1',
            [parentTaskId, occurrenceDate, triggerType]
          );

          if (logs.length === 0) {
            // Not sent yet. Insert lock to prevent duplicate concurrent processing.
            try {
              await db.execute(
                'INSERT INTO email_reminders_log (user_id, task_id, occurrence_date, reminder_type) VALUES (?, ?, ?, ?)',
                [user.id, parentTaskId, occurrenceDate, triggerType]
              );
              
              // If insert succeeds (no unique constraint error), send the email.
              await sendTaskReminderEmail(user.email, subject, task, triggerType);
            } catch (err) {
              // Duplicate key error means another process/thread just handled it.
              if (!err.message.includes('Duplicate entry') && !err.message.includes('duplicate key')) {
                console.error(`[CRON ERROR] DB insert failed for task ${parentTaskId}:`, err);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[CRON ERROR] Failed to check reminders:', err);
  }
}

export function initCronScheduler() {
  console.log('[CRON SCHEDULER] Initializing email reminder checks...');
  
  // Run exactly at the 0th second of every minute
  cron.schedule('* * * * *', () => {
    checkReminders();
  });
  
  // Do an initial check 5 seconds after startup just in case we missed a window
  setTimeout(() => {
    checkReminders();
  }, 5000);
}
