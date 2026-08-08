/**
 * Task Status Helper (Frontend)
 * Dynamically computes task status based on the current date, time, and completion state.
 */

export function calculateTaskStatus(task, referenceTime = new Date()) {
  // 1. Completed state
  if (task.completed) return 'Completed';
  
  // 2. No Due Date state
  if (!task.dueDate) return 'No Due Date';

  // 3. Parse due date (YYYY-MM-DD) and due time (HH:MM:SS or HH:MM)
  const [year, month, day] = task.dueDate.split('-').map(Number);
  const dueTimeStr = task.dueTime || '23:59:59';
  const [hours, minutes, seconds = 0] = dueTimeStr.split(':').map(Number);

  // Construct due date object in system local timezone
  const dueDateTime = new Date(year, month - 1, day, hours, minutes, seconds);

  // 4. Overdue state: if due date/time has passed relative to referenceTime
  if (dueDateTime < referenceTime) {
    return 'Overdue';
  }

  // 5. Due Today state: check if due date is today in system local timezone
  const refYear = referenceTime.getFullYear();
  const refMonth = referenceTime.getMonth();
  const refDay = referenceTime.getDate();
  
  if (year === refYear && (month - 1) === refMonth && day === refDay) {
    return 'Due Today';
  }

  // 6. Upcoming state: due date is in the future
  return 'Upcoming';
}

/**
 * Formats a 24-hour time string (e.g., "14:30" or "14:30:00") into 12-hour format with AM/PM (e.g., "2:30 PM").
 */
export function formatTime12Hour(timeStr) {
  if (!timeStr) return '';
  const parts = String(timeStr).split(':');
  if (parts.length < 2) return timeStr;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].substring(0, 2);
  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Hour 0 is 12 AM

  return `${hours}:${minutes} ${ampm}`;
}
