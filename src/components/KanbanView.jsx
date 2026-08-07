import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

export default function KanbanView({ 
  tasks, 
  categories = [], 
  onToggleComplete, 
  onEdit, 
  onDelete, 
  onOpenCreateModal,
  onUpdateKanbanStatus 
}) {
  const columns = useMemo(() => [
    { id: 'Todo', title: '📋 Todo', color: 'var(--accent-primary)' },
    { id: 'In Progress', title: '🚀 In Progress', color: 'var(--warning-color)' },
    { id: 'Review', title: '👀 Review', color: 'var(--info-color)' },
    { id: 'Completed', title: '✅ Completed', color: 'var(--success-color)' }
  ], []);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    if (destination.droppableId !== source.droppableId) {
      const taskId = parseInt(draggableId, 10);
      if (onUpdateKanbanStatus) {
        onUpdateKanbanStatus(taskId, destination.droppableId);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="kanban-board"
      >
        {columns.map(col => {
          const colTasks = tasks.filter(t => (t.kanbanStatus || 'Todo') === col.id);
          
          return (
            <div key={col.id} className="kanban-column">
              <div className="kanban-col-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.95rem' }}>
                  <span>{col.title}</span>
                  <span className="kanban-count-pill" style={{ borderLeft: `3px solid ${col.color}` }}>
                    {colTasks.length}
                  </span>
                </div>
                <button className="action-icon-btn" onClick={onOpenCreateModal} title="Add Task">
                  <Plus size={16} />
                </button>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '1rem', 
                      flex: 1, 
                      overflowY: 'auto',
                      paddingBottom: '1rem',
                      minHeight: '200px',
                      background: snapshot.isDraggingOver ? 'rgba(255,255,255,0.02)' : 'transparent',
                      borderRadius: 'var(--radius-md)',
                      transition: 'background 0.2s'
                    }}
                  >
                    {colTasks.length > 0 ? (
                      colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.8 : 1,
                                transform: snapshot.isDragging 
                                  ? `${provided.draggableProps.style?.transform || ''} scale(1.02)` 
                                  : provided.draggableProps.style?.transform,
                                zIndex: snapshot.isDragging ? 999 : 'auto'
                              }}
                            >
                              <TaskCard 
                                task={task}
                                categories={categories}
                                onToggleComplete={onToggleComplete}
                                onEdit={onEdit}
                                onDelete={onDelete}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))
                    ) : (
                      <div style={{ 
                        padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-dim)', 
                        fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)',
                        margin: '0.5rem 0'
                      }}>
                        Drop tasks here
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </motion.div>
    </DragDropContext>
  );
}
