/**
 * Recurrence Helper
 * Dynamically generates virtual task occurrences for recurring tasks within a specific date range.
 */

export function generateOccurrences(task, rangeStart, rangeEnd, completedDatesSet = new Set()) {
  // If task is not recurring, return it directly
  if (task.repeatType === 'None' || !task.repeatType) {
    return [task];
  }

  const occurrences = [];
  
  // Parse limit dates
  const startLimit = new Date(rangeStart + 'T00:00:00');
  const endLimit = new Date(rangeEnd + 'T00:00:00');
  
  // Start date of the task recurrence
  const initialStartDateStr = task.startDate || task.dueDate;
  if (!initialStartDateStr) {
    return [task]; // Safeguard
  }
  const taskStart = new Date(initialStartDateStr + 'T00:00:00');
  
  // End date of recurrence
  const taskEnd = task.endDate ? new Date(task.endDate + 'T00:00:00') : null;

  // Actual bounds of generation
  const genStart = new Date(Math.max(taskStart.getTime(), startLimit.getTime()));
  const genEnd = taskEnd ? new Date(Math.min(taskEnd.getTime(), endLimit.getTime())) : endLimit;

  if (genStart > genEnd) {
    return [];
  }

  const interval = task.repeatInterval || 1;
  let current = new Date(taskStart);

  // Cap generation to prevent infinite loops (max 1000 occurrences per query range)
  let loopCount = 0;
  const maxLoops = 1000;

  while (current <= genEnd && loopCount < maxLoops) {
    loopCount++;

    if (current >= genStart) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const occurrenceId = `${task.id}_${dateStr}`;
      
      // Clone task and overwrite virtual occurrence attributes
      const occurrence = {
        ...task,
        id: occurrenceId,
        dueDate: dateStr,
        completed: completedDatesSet.has(dateStr),
        isOccurrence: true,
        parentTaskId: task.id
      };
      
      occurrences.push(occurrence);
    }

    // Increment current date
    if (task.repeatType === 'Daily') {
      current.setDate(current.getDate() + interval);
    } else if (task.repeatType === 'Weekly') {
      current.setDate(current.getDate() + (7 * interval));
    } else if (task.repeatType === 'Monthly') {
      current.setMonth(current.getMonth() + interval);
    } else if (task.repeatType === 'Custom') {
      current.setDate(current.getDate() + interval);
    } else {
      break;
    }
  }

  return occurrences;
}
