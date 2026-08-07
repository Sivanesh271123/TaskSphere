/**
 * Browser Notification Service
 * Manages notification permission requesting, polling checks, and completion success notifications.
 */

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    return Notification.permission;
  }
}

export function checkAndNotifyTasks(tasks, isEnabled) {
  if (!isEnabled) return;
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  
  // Format local date YYYY-MM-DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Load notified occurrences from localStorage
  let notified = [];
  try {
    notified = JSON.parse(localStorage.getItem('notified_occurrences') || '[]');
  } catch (e) {
    notified = [];
  }
  const notifiedKeys = new Set(notified);

  tasks.forEach(task => {
    if (task.completed) return;

    const taskIdStr = String(task.id);

    // 1. Overdue check
    if (task.status === 'Overdue') {
      const key = `overdue_${taskIdStr}`;
      if (!notifiedKeys.has(key)) {
        try {
          new Notification('Task Overdue', {
            body: `🏃 ${task.title} is overdue.`,
            icon: '/favicon.ico'
          });
          notifiedKeys.add(key);
        } catch (e) {
          console.error('Failed to trigger notification:', e);
        }
      }
    }

    // 2. Due Today or Recurring Task appears for today check
    if (task.status === 'Due Today') {
      const key = `today_${taskIdStr}`;
      if (!notifiedKeys.has(key)) {
        try {
          const prefix = task.repeatType && task.repeatType !== 'None' ? '🔁' : '📚';
          new Notification('Task Due Today', {
            body: `${prefix} ${task.title} is due today.`,
            icon: '/favicon.ico'
          });
          notifiedKeys.add(key);
        } catch (e) {
          console.error('Failed to trigger notification:', e);
        }
      }
    }

    // 3. Due within one hour check
    if (task.dueDate === todayStr && task.dueTime) {
      const [h, m] = task.dueTime.split(':').map(Number);
      const taskMinutes = h * 60 + m;
      const diff = taskMinutes - currentMinutes;

      // If due within 60 minutes and is upcoming
      if (diff > 0 && diff <= 60) {
        const key = `one_hour_${taskIdStr}`;
        if (!notifiedKeys.has(key)) {
          try {
            new Notification('Upcoming Task Reminder', {
              body: `💼 ${task.title} starts in 1 hour.`,
              icon: '/favicon.ico'
            });
            notifiedKeys.add(key);
          } catch (e) {
            console.error('Failed to trigger notification:', e);
          }
        }
      }
    }
  });

  // Save back
  try {
    localStorage.setItem('notified_occurrences', JSON.stringify(Array.from(notifiedKeys)));
  } catch (e) {
    console.error('Failed to save notification tracking state:', e);
  }
}

export function notifyTaskCompleted(taskTitle, isEnabled) {
  if (!isEnabled) return;
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification('Task Completed!', {
      body: `🎉 Great job! You completed today's ${taskTitle} task.`,
      icon: '/favicon.ico'
    });
  } catch (e) {
    console.error('Failed to trigger completion notification:', e);
  }
}
