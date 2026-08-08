import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { calculateTaskStatus, formatTime12Hour } from '../utils/statusHelper.js';
import { Edit3, CheckCircle2, Check, Clock, Calendar as CalendarIcon, Tag, Plus, X, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarView({ tasks, categories = [], onEdit, onToggleComplete, onSaveTask, onRescheduleTask, onOpenCreateModal }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState('month'); // 'month' | 'week' | 'day'

  // Quick Add Popup State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('Personal');
  const [quickPriority, setQuickPriority] = useState('Medium');
  const [quickTime, setQuickTime] = useState('09:00');
  const [quickDate, setQuickDate] = useState(new Date());

  // Memoize tasks grouped by date using useMemo
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (t.dueDate) {
        if (!map[t.dueDate]) map[t.dueDate] = [];
        map[t.dueDate].push(t);
      }
    });
    return map;
  }, [tasks]);

  // Memoize categories list
  const categoriesList = useMemo(() => {
    const defaults = ['Personal', 'Work', 'Fitness', 'Education', 'Finance'];
    if (!categories || categories.length === 0) return defaults;
    const names = categories.map(c => typeof c === 'string' ? c : (c.name || 'Personal'));
    return Array.from(new Set([...names, ...defaults]));
  }, [categories]);

  // Memoize formatted selected date string (YYYY-MM-DD)
  const selectedDateStr = useMemo(() => {
    if (!selectedDate) return '';
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  // Memoize quick date string (YYYY-MM-DD)
  const quickDateStr = useMemo(() => {
    if (!quickDate) return '';
    const year = quickDate.getFullYear();
    const month = String(quickDate.getMonth() + 1).padStart(2, '0');
    const day = String(quickDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [quickDate]);

  // Formatted quick date label
  const quickDateFormatted = useMemo(() => {
    if (!quickDate) return '';
    return quickDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }, [quickDate]);

  // Memoize selected date tasks
  const selectedTasks = useMemo(() => {
    return selectedDateStr ? (tasksByDate[selectedDateStr] || []) : [];
  }, [selectedDateStr, tasksByDate]);

  // Memoize week days (Sunday to Saturday) for Week View
  const weekDays = useMemo(() => {
    if (!selectedDate) return [];
    const curr = new Date(selectedDate);
    const sunday = new Date(curr);
    sunday.setDate(curr.getDate() - curr.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;

      days.push({
        date: d,
        dateStr,
        isToday: d.toDateString() === new Date().toDateString(),
        isSelected: d.toDateString() === selectedDate.toDateString(),
        tasks: tasksByDate[dateStr] || []
      });
    }
    return days;
  }, [selectedDate, tasksByDate]);

  // Memoize day view tasks sorted by due time
  const dayViewTasks = useMemo(() => {
    if (!selectedDateStr) return [];
    const list = [...(tasksByDate[selectedDateStr] || [])];
    list.sort((a, b) => {
      const timeA = a.dueTime || '23:59:59';
      const timeB = b.dueTime || '23:59:59';
      return timeA.localeCompare(timeB);
    });
    return list;
  }, [selectedDateStr, tasksByDate]);

  // Memoize header navigation title label
  const viewTitleLabel = useMemo(() => {
    if (!selectedDate) return '';
    if (calendarMode === 'month') {
      return selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    } else if (calendarMode === 'week') {
      if (weekDays.length === 0) return '';
      const start = weekDays[0].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const end = weekDays[6].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      return `Week of ${start} – ${end}`;
    } else {
      return selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }
  }, [selectedDate, calendarMode, weekDays]);

  // Navigation handlers
  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handlePrev = () => {
    if (calendarMode === 'month') {
      setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else if (calendarMode === 'week') {
      setSelectedDate(prev => {
        const d = new Date(prev);
        d.setDate(d.getDate() - 7);
        return d;
      });
    } else {
      setSelectedDate(prev => {
        const d = new Date(prev);
        d.setDate(d.getDate() - 1);
        return d;
      });
    }
  };

  const handleNext = () => {
    if (calendarMode === 'month') {
      setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else if (calendarMode === 'week') {
      setSelectedDate(prev => {
        const d = new Date(prev);
        d.setDate(d.getDate() + 7);
        return d;
      });
    } else {
      setSelectedDate(prev => {
        const d = new Date(prev);
        d.setDate(d.getDate() + 1);
        return d;
      });
    }
  };

  // Open Quick Add Modal for a given date
  const openQuickAddForDate = (date) => {
    const targetDate = date || selectedDate || new Date();
    setQuickDate(targetDate);
    setQuickTitle('');
    setQuickCategory(categoriesList[0] || 'Personal');
    setQuickPriority('Medium');
    setQuickTime('09:00');
    setIsQuickAddOpen(true);
  };

  // Calendar Date Tile Click Handler
  const handleDateChange = (date) => {
    setSelectedDate(date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dayTasks = tasksByDate[dateStr] || [];
    // If the clicked date has NO tasks, automatically open the Quick Add Task popup!
    if (dayTasks.length === 0) {
      openQuickAddForDate(date);
    }
  };

  // Handle Quick Add Task Form Submission
  const handleQuickAddSave = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) {
      alert('Please enter a task title');
      return;
    }

    const taskData = {
      title: quickTitle.trim(),
      category: quickCategory || 'Personal',
      priority: quickPriority || 'Medium',
      dueDate: quickDateStr, // Automatically bound to selected date!
      dueTime: quickTime || '09:00',
      completed: false
    };

    if (onSaveTask) {
      await onSaveTask(taskData);
    }
    
    setIsQuickAddOpen(false);
    setQuickTitle('');
  };

  // Memoize date-to-highest-priority status mapping for tile background highlighting
  const dayStatusMap = useMemo(() => {
    const map = {};
    Object.keys(tasksByDate).forEach(dateStr => {
      const dayTasks = tasksByDate[dateStr];
      if (!dayTasks || dayTasks.length === 0) return;

      const statuses = dayTasks.map(t => calculateTaskStatus(t));

      // Priority Order: Overdue > Due Today > Upcoming > Completed
      if (statuses.includes('Overdue')) {
        map[dateStr] = 'Overdue';
      } else if (statuses.includes('Due Today')) {
        map[dateStr] = 'Due Today';
      } else if (statuses.includes('Upcoming')) {
        map[dateStr] = 'Upcoming';
      } else if (statuses.includes('Completed')) {
        map[dateStr] = 'Completed';
      }
    });
    return map;
  }, [tasksByDate]);

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const classes = [];

    const today = new Date();
    if (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    ) {
      classes.push('tile-is-today');
    }

    const status = dayStatusMap[dateStr];
    if (status === 'Overdue') {
      classes.push('tile-overdue');
    } else if (status === 'Due Today') {
      classes.push('tile-due-today');
    } else if (status === 'Upcoming') {
      classes.push('tile-upcoming');
    } else if (status === 'Completed') {
      classes.push('tile-completed');
    }

    return classes.join(' ');
  };

  const getDotColor = (task) => {
    const status = calculateTaskStatus(task);
    switch (status) {
      case 'Overdue':
        return 'var(--danger-color)';
      case 'Due Today':
        return 'var(--warning-color)';
      case 'Upcoming':
        return 'var(--info-color)';
      case 'Completed':
        return 'var(--success-color)';
      default:
        return 'var(--info-color)';
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Overdue':
        return { bg: 'var(--danger-bg)', color: 'var(--danger-color)', border: '1px solid var(--border-color)' };
      case 'Due Today':
        return { bg: 'var(--warning-bg)', color: 'var(--warning-color)', border: '1px solid var(--border-color)' };
      case 'Upcoming':
        return { bg: 'var(--info-bg)', color: 'var(--info-color)', border: '1px solid var(--border-color)' };
      case 'Completed':
        return { bg: 'var(--success-bg)', color: 'var(--success-color)', border: '1px solid var(--border-color)' };
      default:
        return { bg: 'var(--surface-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' };
    }
  };

  const getPriorityBadgeStyle = (priority) => {
    const p = (priority || 'Medium').toLowerCase();
    if (p === 'high') {
      return { bg: 'var(--danger-bg)', color: 'var(--danger-color)' };
    } else if (p === 'medium') {
      return { bg: 'var(--warning-bg)', color: 'var(--warning-color)' };
    }
    return { bg: 'var(--info-bg)', color: 'var(--info-color)' };
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayTasks = tasksByDate[dateStr] || [];
      return (
        <div 
          className="calendar-tile-droppable"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            e.currentTarget.classList.add('tile-drag-over');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove('tile-drag-over');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove('tile-drag-over');

            try {
              const rawData = e.dataTransfer.getData('application/json');
              if (!rawData) return;
              const taskData = JSON.parse(rawData);
              if (!taskData || !taskData.id) return;

              if (taskData.dueDate === dateStr) return; // Dropped on same date -> do nothing!

              if (onRescheduleTask) {
                onRescheduleTask(taskData, dateStr);
              }
            } catch (err) {
              console.error('Failed to parse dropped task data:', err);
            }
          }}
          style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end', alignItems: 'center',
            borderRadius: 'var(--radius-md)', padding: '2px 0'
          }}
        >
          {dayTasks.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
              {dayTasks.length > 3 ? (
                <span style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-gold, #d4af37)' }}>
                  +{dayTasks.length} Tasks
                </span>
              ) : (
                dayTasks.map(t => (
                  <div 
                    key={t.id} 
                    style={{
                      width: '7px', 
                      height: '7px', 
                      borderRadius: '50%', 
                      backgroundColor: getDotColor(t),
                      boxShadow: '0 0 3px rgba(0,0,0,0.5)'
                    }} 
                    title={`${t.title} (${calculateTaskStatus(t)})`}
                  />
                ))
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      <style>{`
        .react-calendar {
          width: 100%;
          background: transparent;
          border: none;
          font-family: inherit;
          color: var(--text-main);
        }
        .react-calendar__navigation button {
          color: var(--text-main);
          min-width: 44px;
          background: none;
          font-size: 1.1rem;
          font-weight: 700;
        }
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-md);
        }
        .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-weight: 800;
          font-size: 0.75em;
          color: var(--text-muted);
        }
        .react-calendar__month-view__days__day {
          color: var(--text-main);
          padding: 0.5rem 0.35rem;
          height: 85px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          border: 1px solid rgba(255, 255, 255, 0.02);
          transition: all 0.2s ease;
          position: relative;
        }
        /* Date Highlighting Styles */
        .react-calendar__month-view__days__day.tile-overdue {
          background: rgba(239, 68, 68, 0.15) !important;
          border: 1px solid rgba(239, 68, 68, 0.4) !important;
          border-radius: var(--radius-md) !important;
        }
        .react-calendar__month-view__days__day.tile-due-today {
          background: rgba(249, 115, 22, 0.15) !important;
          border: 1px solid rgba(249, 115, 22, 0.4) !important;
          border-radius: var(--radius-md) !important;
        }
        .react-calendar__month-view__days__day.tile-upcoming {
          background: rgba(59, 130, 246, 0.15) !important;
          border: 1px solid rgba(59, 130, 246, 0.4) !important;
          border-radius: var(--radius-md) !important;
        }
        .react-calendar__month-view__days__day.tile-completed {
          background: rgba(16, 185, 129, 0.15) !important;
          border: 1px solid rgba(16, 185, 129, 0.4) !important;
          border-radius: var(--radius-md) !important;
        }
        /* Drop Target Hover Glow */
        .tile-drag-over {
          background: rgba(212, 175, 55, 0.25) !important;
          border: 2px dashed var(--accent-gold-main, #d4af37) !important;
          box-shadow: 0 0 14px rgba(212, 175, 55, 0.4) !important;
          transform: scale(1.02);
        }
        .task-draggable-card {
          cursor: grab !important;
        }
        .task-draggable-card:active {
          cursor: grabbing !important;
        }
        /* Today's Gold Border Rule - Always takes precedence for border & glow */
        .react-calendar__month-view__days__day.tile-is-today,
        .react-calendar__tile--now {
          border: 2px solid var(--accent-gold-main, #d4af37) !important;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.35) !important;
          border-radius: var(--radius-md) !important;
        }
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-radius: var(--radius-md);
        }
        .react-calendar__tile--active {
          background: rgba(212, 175, 55, 0.2) !important;
          border-radius: var(--radius-md);
          outline: 1px solid var(--accent-gold-main, #d4af37) !important;
          color: var(--text-gold) !important;
        }
        .react-calendar__month-view__days__day--neighboringMonth {
          color: var(--text-muted) !important;
          opacity: 0.4;
        }
        @media (max-width: 900px) {
          .calendar-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Control Top Bar: Navigation & Segmented View Controls */}
      <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Left: Prev / Next / Today & Date Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}
            onClick={handleToday}
          >
            Today
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button className="action-icon-btn" onClick={handlePrev} title="Previous">
              <ChevronLeft size={18} />
            </button>
            <button className="action-icon-btn" onClick={handleNext} title="Next">
              <ChevronRight size={18} />
            </button>
          </div>

          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-gold)', margin: 0 }}>
            {viewTitleLabel}
          </h2>
        </div>

        {/* Right: Segmented View Selector (Month | Week | Day) */}
        <div className="view-tabs" style={{ margin: 0 }}>
          <button 
            className={`view-tab-btn ${calendarMode === 'month' ? 'active' : ''}`}
            onClick={() => setCalendarMode('month')}
          >
            <span>Month</span>
          </button>

          <button 
            className={`view-tab-btn ${calendarMode === 'week' ? 'active' : ''}`}
            onClick={() => setCalendarMode('week')}
          >
            <span>Week</span>
          </button>

          <button 
            className={`view-tab-btn ${calendarMode === 'day' ? 'active' : ''}`}
            onClick={() => setCalendarMode('day')}
          >
            <span>Day</span>
          </button>
        </div>
      </div>
      
      {/* ─── MONTH VIEW MODE ─────────────────────────────────────────────────── */}
      {calendarMode === 'month' && (
        <div className="calendar-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Calendar Grid Container */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <Calendar 
              onChange={handleDateChange} 
              value={selectedDate}
              tileContent={tileContent}
              tileClassName={tileClassName}
              prev2Label={null}
              next2Label={null}
            />
          </div>

          {/* Selected Date Tasks Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-gold)' }}>
                  Tasks for {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedTasks.length} {selectedTasks.length === 1 ? 'task' : 'tasks'} scheduled
                </span>
              </div>

              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px', borderColor: 'var(--accent-gold-main)', color: 'var(--text-gold)' }}
                onClick={() => openQuickAddForDate(selectedDate)}
              >
                <Plus size={14} /> <span>Quick Add</span>
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
              {selectedTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <CalendarIcon size={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <p style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '1rem' }}>No tasks scheduled for this day.</p>
                  <button 
                    className="btn btn-primary" 
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
                    onClick={() => openQuickAddForDate(selectedDate)}
                  >
                    <Plus size={14} /> <span>Quick Add Task</span>
                  </button>
                </div>
              ) : (
                selectedTasks.map(t => {
                  const status = calculateTaskStatus(t);
                  const statusStyle = getStatusBadgeStyle(status);
                  const priorityStyle = getPriorityBadgeStyle(t.priority);

                  return (
                    <div 
                      key={t.id} 
                      className="glass-panel task-draggable-card"
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify(t));
                        e.dataTransfer.effectAllowed = 'move';
                        e.currentTarget.style.opacity = '0.4';
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.style.opacity = t.completed ? '0.75' : '1';
                      }}
                      style={{ 
                        padding: '1rem', 
                        borderRadius: 'var(--radius-md)', 
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem',
                        opacity: t.completed ? 0.75 : 1,
                        transition: 'all 0.2s',
                        cursor: 'grab'
                      }}
                    >
                      {/* Card Header: Title & Status Badge */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                          <GripVertical size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, cursor: 'grab' }} title="Drag to reschedule date" />
                          <strong style={{ 
                            fontSize: '0.98rem', 
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            textDecoration: t.completed ? 'line-through' : 'none',
                            lineHeight: 1.3
                          }}>
                            {t.title}
                          </strong>
                        </div>

                        {/* Status Badge */}
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '12px',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: statusStyle.border,
                          whiteSpace: 'nowrap'
                        }}>
                          {status}
                        </span>
                      </div>

                      {/* Badges Row: Category, Priority, Due Time */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                        <span style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '0.2rem 0.5rem', borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-main)',
                          fontWeight: 600
                        }}>
                          <Tag size={11} /> {t.category || 'Personal'}
                        </span>

                        <span style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '0.2rem 0.5rem', borderRadius: '6px',
                          background: priorityStyle.bg, color: priorityStyle.color,
                          fontWeight: 700
                        }}>
                          {t.priority || 'Medium'} Priority
                        </span>

                        {t.dueTime && (
                          <span style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '0.2rem 0.5rem', borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-muted)',
                            fontWeight: 600
                          }}>
                            <Clock size={11} /> {formatTime12Hour(t.dueTime)}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons: Edit and Mark Complete */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.35rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <button 
                          className="btn btn-secondary btn-icon" 
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => onEdit(t)} 
                          title="Edit Task"
                        >
                          <Edit3 size={13} /> <span>Edit</span>
                        </button>

                        <button 
                          className={t.completed ? "btn btn-secondary" : "btn btn-primary"}
                          style={{ 
                            padding: '0.35rem 0.65rem', 
                            fontSize: '0.78rem', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            color: t.completed ? 'var(--success-color)' : 'white'
                          }}
                          onClick={() => onToggleComplete && onToggleComplete(t.id)} 
                          title={t.completed ? "Mark Incomplete" : "Mark Complete"}
                        >
                          {t.completed ? <CheckCircle2 size={14} /> : <Check size={14} />}
                          <span>{t.completed ? "Completed" : "Mark Complete"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── WEEK VIEW MODE ───────────────────────────────────────────────────── */}
      {calendarMode === 'week' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem', overflowX: 'auto' }}>
          {weekDays.map(wd => {
            return (
              <div 
                key={wd.dateStr}
                className={`glass-panel ${wd.isToday ? 'tile-is-today' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  e.currentTarget.classList.add('tile-drag-over');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('tile-drag-over');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('tile-drag-over');
                  try {
                    const rawData = e.dataTransfer.getData('application/json');
                    if (!rawData) return;
                    const taskData = JSON.parse(rawData);
                    if (taskData && taskData.id && taskData.dueDate !== wd.dateStr && onRescheduleTask) {
                      onRescheduleTask(taskData, wd.dateStr);
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                onClick={() => setSelectedDate(wd.date)}
                style={{ 
                  padding: '0.85rem 0.65rem', 
                  minHeight: '440px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  border: wd.isSelected ? '1px solid var(--accent-gold-main)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg, 12px)',
                  cursor: 'pointer'
                }}
              >
                {/* Header: Day Name & Date */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: wd.isToday ? 'var(--text-gold)' : 'var(--text-muted)', fontWeight: 800, display: 'block' }}>
                      {wd.date.toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: wd.isToday ? 'var(--text-gold)' : 'var(--text-main)' }}>
                      {wd.date.getDate()}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '10px' }}>
                      {wd.tasks.length}
                    </span>
                    <button 
                      className="action-icon-btn" 
                      style={{ width: '22px', height: '22px' }}
                      onClick={(e) => { e.stopPropagation(); openQuickAddForDate(wd.date); }}
                      title="Quick Add Task"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                {/* Tasks List in Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1, overflowY: 'auto' }}>
                  {wd.tasks.length === 0 ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1.5rem', fontStyle: 'italic' }}>
                      No tasks
                    </span>
                  ) : (
                    wd.tasks.map(t => {
                      const status = calculateTaskStatus(t);
                      const statusStyle = getStatusBadgeStyle(status);
                      return (
                        <div 
                          key={t.id}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/json', JSON.stringify(t));
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onClick={(e) => { e.stopPropagation(); onEdit(t); }}
                          className="glass-panel task-draggable-card"
                          style={{ 
                            padding: '0.55rem 0.65rem', 
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-color)',
                            display: 'flex', flexDirection: 'column', gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)', textDecoration: t.completed ? 'line-through' : 'none', lineHeight: 1.25 }}>
                            {t.title}
                          </strong>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {t.dueTime && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                <Clock size={10} /> {formatTime12Hour(t.dueTime)}
                              </span>
                            )}
                            <span style={{ color: statusStyle.color, fontWeight: 700 }}>
                              {status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── DAY VIEW MODE ────────────────────────────────────────────────────── */}
      {calendarMode === 'day' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-gold)' }}>
                Tasks for {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {dayViewTasks.length} {dayViewTasks.length === 1 ? 'task' : 'tasks'} scheduled (sorted by due time)
              </span>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              onClick={() => openQuickAddForDate(selectedDate)}
            >
              <Plus size={16} /> <span>Quick Add Task</span>
            </button>
          </div>

          {dayViewTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <CalendarIcon size={44} style={{ opacity: 0.25, marginBottom: '1rem' }} />
              <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>No tasks scheduled for this day.</p>
              <button 
                className="btn btn-primary"
                onClick={() => openQuickAddForDate(selectedDate)}
              >
                <Plus size={16} /> <span>Quick Add Task</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {dayViewTasks.map(t => {
                const status = calculateTaskStatus(t);
                const statusStyle = getStatusBadgeStyle(status);
                const priorityStyle = getPriorityBadgeStyle(t.priority);

                return (
                  <div 
                    key={t.id}
                    className="glass-panel"
                    style={{ 
                      padding: '1.25rem', 
                      borderRadius: 'var(--radius-lg, 14px)', 
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      display: 'grid',
                      gridTemplateColumns: '110px 1fr auto',
                      gap: '1.25rem',
                      alignItems: 'center',
                      opacity: t.completed ? 0.75 : 1
                    }}
                  >
                    {/* Time Column */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-gold)', fontWeight: 800, fontSize: '0.95rem' }}>
                      <Clock size={16} />
                      <span>{t.dueTime ? formatTime12Hour(t.dueTime) : 'All Day'}</span>
                    </div>

                    {/* Title & Badges Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', textDecoration: t.completed ? 'line-through' : 'none' }}>
                        {t.title}
                      </strong>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                        <span style={{ padding: '0.2rem 0.55rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-main)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Tag size={12} /> {t.category || 'Personal'}
                        </span>

                        <span style={{ padding: '0.2rem 0.55rem', borderRadius: '6px', background: priorityStyle.bg, color: priorityStyle.color, fontWeight: 700 }}>
                          {t.priority || 'Medium'} Priority
                        </span>

                        <span style={{ padding: '0.2rem 0.55rem', borderRadius: '12px', background: statusStyle.bg, color: statusStyle.color, border: statusStyle.border, fontWeight: 700 }}>
                          {status}
                        </span>
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary btn-icon" 
                        onClick={() => onEdit(t)} 
                        title="Edit Task"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                      >
                        <Edit3 size={14} /> <span>Edit</span>
                      </button>

                      <button 
                        className={t.completed ? "btn btn-secondary" : "btn btn-primary"}
                        onClick={() => onToggleComplete && onToggleComplete(t.id)} 
                        title={t.completed ? "Mark Incomplete" : "Mark Complete"}
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                      >
                        {t.completed ? <CheckCircle2 size={15} /> : <Check size={15} />}
                        <span>{t.completed ? "Completed" : "Mark Complete"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Add Task Modal Popup */}
      <AnimatePresence>
        {isQuickAddOpen && (
          <div 
            className="modal-overlay" 
            style={{ 
              position: 'fixed', inset: 0, 
              background: 'rgba(0, 0, 0, 0.75)', 
              backdropFilter: 'blur(8px)',
              zIndex: 9999, display: 'flex', 
              alignItems: 'center', justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={() => setIsQuickAddOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content glass-panel"
              style={{ 
                width: '100%', maxWidth: '440px', 
                padding: '1.75rem', borderRadius: 'var(--radius-lg, 16px)',
                background: 'var(--bg-card, #12131a)',
                border: '1px solid var(--border-color, rgba(255,255,255,0.1))'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-gold, #d4af37)' }}>
                    ⚡ Quick Add Task
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Due Date: <strong style={{ color: 'var(--text-main)' }}>{quickDateFormatted}</strong>
                  </span>
                </div>
                <button className="action-icon-btn" onClick={() => setIsQuickAddOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleQuickAddSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                    Task Title *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Enter task title..."
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    style={{
                      width: '100%', padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md, 8px)',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                      color: 'var(--text-main, #ffffff)', fontSize: '0.9rem',
                      outline: 'none'
                    }}
                    autoFocus
                  />
                </div>

                {/* Category & Priority Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {/* Category */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                      Category
                    </label>
                    <select
                      value={quickCategory}
                      onChange={(e) => setQuickCategory(e.target.value)}
                      style={{
                        width: '100%', padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md, 8px)',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                        color: 'var(--text-main, #ffffff)', fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    >
                      {categoriesList.map(c => (
                        <option key={c} value={c} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                      Priority
                    </label>
                    <select
                      value={quickPriority}
                      onChange={(e) => setQuickPriority(e.target.value)}
                      style={{
                        width: '100%', padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md, 8px)',
                        background: 'var(--surface-subtle)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)', fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    >
                      <option value="High" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>High</option>
                      <option value="Medium" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Medium</option>
                      <option value="Low" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Low</option>
                    </select>
                  </div>
                </div>

                {/* Due Time */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                    Due Time
                  </label>
                  <input 
                    type="time"
                    value={quickTime}
                    onChange={(e) => setQuickTime(e.target.value)}
                    style={{
                      width: '100%', padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md, 8px)',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                      color: 'var(--text-main, #ffffff)', fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setIsQuickAddOpen(false)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    Save Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
