import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, CheckCheck, LayoutList, Kanban, Calendar 
} from 'lucide-react';
import TaskCard from '../components/TaskCard';
import KanbanView from '../components/KanbanView';
import CalendarView from '../components/CalendarView';
import SkeletonTaskCard from '../components/SkeletonTaskCard';
import StatsOverview from '../components/StatsOverview';

export default function TasksPage({
  tasks,
  isLoading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  sortBy,
  setSortBy,
  filteredTasks,
  onToggleComplete,
  onOpenEditModal,
  onDeleteTask,
  onClearCompleted,
  onOpenCreateModal
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
          tasks={filteredTasks}
          onToggleComplete={onToggleComplete}
          onEdit={onOpenEditModal}
          onDelete={onDeleteTask}
          onOpenCreateModal={onOpenCreateModal}
        />
      )}

      {taskSubView === 'calendar' && (
        <CalendarView 
          tasks={tasks}
          onEdit={onOpenEditModal}
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All
              </button>
              <button 
                className={`filter-chip ${statusFilter === 'active' ? 'active' : ''}`}
                onClick={() => setStatusFilter('active')}
              >
                Active
              </button>
              <button 
                className={`filter-chip ${statusFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('completed')}
              >
                Completed
              </button>

              <select 
                className="select-input"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Work">💻 Work</option>
                <option value="Personal">🏠 Personal</option>
                <option value="Urgent">🔥 Urgent</option>
                <option value="Ideas">💡 Ideas</option>
              </select>

              <select 
                className="select-input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
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

          {/* Task Grid */}
          {isLoading ? (
            <div className="tasks-grid-luxury">
              <SkeletonTaskCard />
              <SkeletonTaskCard />
              <SkeletonTaskCard />
            </div>
          ) : filteredTasks.length > 0 ? (
            <div className="tasks-grid-luxury">
              <AnimatePresence>
                {filteredTasks.map(task => (
                  <TaskCard 
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onOpenEditModal}
                    onDelete={onDeleteTask}
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
