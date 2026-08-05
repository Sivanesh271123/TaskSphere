import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function CalendarView({ tasks, onEdit, onOpenCreateModal }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysHeader = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Map tasks by date ISO YYYY-MM-DD
  const tasksByDate = {};
  tasks.forEach(t => {
    if (t.dueDate) {
      if (!tasksByDate[t.dueDate]) tasksByDate[t.dueDate] = [];
      tasksByDate[t.dueDate].push(t);
    }
  });

  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const formattedDay = day < 10 ? `0${day}` : day;
    const formattedMonth = (month + 1) < 10 ? `0${month + 1}` : (month + 1);
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    calendarCells.push({ day, dateStr });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-panel calendar-container"
    >
      <div className="calendar-header-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {monthNames[month]} {year}
          </h2>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }} onClick={() => setCurrentDate(new Date())}>
            Today
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="action-icon-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
          <button className="action-icon-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="calendar-grid">
        {daysHeader.map(d => (
          <div key={d} className="calendar-day-header">{d}</div>
        ))}

        {calendarCells.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} style={{ background: 'transparent' }} />;
          }

          const dayTasks = tasksByDate[cell.dateStr] || [];
          const isToday = cell.dateStr === todayStr;

          return (
            <div 
              key={cell.dateStr}
              className={`calendar-cell ${isToday ? 'today' : ''}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="calendar-cell-date" style={{ color: isToday ? 'var(--accent-pink)' : 'var(--text-muted)' }}>
                  {cell.day}
                </span>
                {dayTasks.length > 0 && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {dayTasks.length}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
                {dayTasks.map(t => (
                  <div 
                    key={t.id} 
                    className="calendar-task-chip"
                    onClick={() => onEdit(t)}
                    title={t.title}
                    style={{ textDecoration: t.completed ? 'line-through' : 'none' }}
                  >
                    {t.completed ? '✓ ' : '• '}{t.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
