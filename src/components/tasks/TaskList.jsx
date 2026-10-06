import TaskItem from './TaskItem'
import EmptyState from '../ui/EmptyState'

export default function TaskList({
  tasks = [],
  emptyTitle = 'No tasks here yet',
  emptyDescription = 'Tasks added to this view will appear here.',
  emptyActionLabel,
  onEmptyAction,
}) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    )
  }

  return (
    <div className="space-y-2.5">
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  )
}
