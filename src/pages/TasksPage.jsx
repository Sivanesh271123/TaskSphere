import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, CheckCheck, LayoutList, Kanban, Calendar 
} from 'lucide-react';
import TaskCard from '../components/TaskCard';
import KanbanView from '../components/KanbanView';
import CalendarView from '../components/CalendarView';
import StatsOverview from '../components/StatsOverview';

export default function TasksPage({
  tasks,
  categories = [],
  isLoading,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortByChange,
  onToggleComplete,
  onEdit,
  onDelete,
  onSendEmailReminder,
  onClearCompleted,
  onOpenCreateModal,
  onSaveTask,
  onRescheduleTask,
  onUpdateKanbanStatus
}) {
  const [taskSubView, setTaskSubView] = useState('list'); // list | kanban | calendar

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Task Statistics Overview */}
      <StatsOverview tasks={tasks} />

      {/* Sub View Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Tasks Workspace</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Manage, edit, and organize all active & completed database records</p>
        </div>

        <div className="view-tabs">
          <button 
            className={`view-tab-btn ${taskSubView === 'list' ? 'active' : ''}`}
            onClick={() => setTaskSubView('list')}
          >
            <LayoutList size={14} /> <span>List</span>
          </button>

          <button 
            className={`view-tab-btn ${taskSubView === 'kanban' ? 'active' : ''}`}
            onClick={() => setTaskSubView('kanban')}
          >
            <Kanban size={14} /> <span>Board</span>
          </button>

          <button 
            className={`view-tab-btn ${taskSubView === 'calendar' ? 'active' : ''}`}
            onClick={() => setTaskSubView('calendar')}
          >
            <Calendar size={14} /> <span>Calendar</span>
          </button>
        </div>
      </div>

      {/* Sub View Renders */}
      {taskSubView === 'kanban' && (
        <KanbanView 
          tasks={tasks}
          categories={categories}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenCreateModal={onOpenCreateModal}
          onUpdateKanbanStatus={onUpdateKanbanStatus}
        />
      )}

      {taskSubView === 'calendar' && (
        <CalendarView 
          tasks={tasks}
          categories={categories}
          onEdit={onEdit}
          onToggleComplete={onToggleComplete}
          onSaveTask={onSaveTask}
          onRescheduleTask={onRescheduleTask}
          onOpenCreateModal={onOpenCreateModal}
        />
      )}

      {taskSubView === 'list' && (
        <>
          {/* Toolbar Search & Filter Controls */}
          <div className="glass-panel toolbar-container">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon-fixed" />
              <input 
                type="text" 
                placeholder="Search by title, category, description..." 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => onStatusFilterChange('all')}
              >
                All
              </button>
              <button 
                className={`filter-chip ${statusFilter === 'active' ? 'active' : ''}`}
                onClick={() => onStatusFilterChange('active')}
              >
                Active
              </button>
              <button 
                className={`filter-chip ${statusFilter === 'completed' ? 'active' : ''}`}
                onClick={() => onStatusFilterChange('completed')}
              >
                Completed
              </button>



              <select 
                className="select-input"
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="dueDate">Sort by Due Date</option>
                <option value="priority">Sort by Priority</option>
              </select>

              {tasks.some(t => t.completed) && (
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.8rem' }}
                  onClick={onClearCompleted}
                >
                  <CheckCheck size={14} /> Clear Done
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Bar */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            overflowX: 'auto', 
            paddingBottom: '0.5rem', 
            marginBottom: '1rem', 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none'
          }}>
            {['All', 'Personal', 'Study', 'Work', 'Shopping', 'Health', 'Finance', 'Others'].map(cat => (
              <button
                key={cat}
                className={`filter-chip ${categoryFilter === (cat === 'All' ? 'all' : cat) ? 'active' : ''}`}
                onClick={() => onCategoryFilterChange(cat === 'All' ? 'all' : cat)}
                style={{ flexShrink: 0 }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Task Grid */}
          {isLoading ? (
            <div className="tasks-grid-luxury">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          ) : tasks.length > 0 ? (
            <div className="tasks-grid-luxury">
              <AnimatePresence>
                {tasks.map(task => (
                  <TaskCard 
                    key={task.id}
                    task={task}
                    categories={categories}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSendEmailReminder={onSendEmailReminder}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="glass-panel empty-state">
              <div className="empty-state-icon">⚡</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>No tasks match your filter</h3>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Try adjusting your search criteria or create a new task.
              </p>
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '1.25rem' }}
                onClick={onOpenCreateModal}
              >
                <Plus size={16} /> Add Task
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
