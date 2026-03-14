import styles from './TaskCard.module.css';

const STATUS_LABELS   = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

function isOverdue(task) {
  if (!task.due_date || task.status === 'done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.due_date) < today;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ── Active task card ──────────────────────────────────────────────────────────
export function TaskCard({ task, onEdit, onDelete, onComplete }) {
  const overdue = isOverdue(task);

  return (
    <div className={`${styles.card} ${overdue ? styles.overdueCard : ''} fade-up`}>
      {overdue && <span className={styles.overdueTag}>Overdue</span>}

      <div className={styles.header}>
        <span className={`${styles.badge} ${styles[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
        <span className={`${styles.badge} ${styles[task.status]}`}>
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      <h3 className={styles.title}>{task.title}</h3>

      {task.description && (
        <p className={styles.desc}>{task.description}</p>
      )}

      {task.due_date && (
        <p className={`${styles.due} ${overdue ? styles.overdueText : ''}`}>
          {overdue ? '⚠ ' : ''}Due {formatDate(task.due_date)}
        </p>
      )}

      <div className={styles.actions}>
        <button className={styles.completeBtn} onClick={() => onComplete(task.id)} title="Mark complete">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M2 7.5L6 11.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Done
        </button>
        <button className={styles.editBtn}    onClick={() => onEdit(task)}>Edit</button>
        <button className={styles.deleteBtn}  onClick={() => onDelete(task)}>Delete</button>
      </div>
    </div>
  );
}

// ── Completed task card ───────────────────────────────────────────────────────
export function CompletedTaskCard({ task, onRestore, onDelete }) {
  return (
    <div className={`${styles.card} ${styles.completedCard} fade-up`}>
      <div className={styles.header}>
        <span className={`${styles.badge} ${styles[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
        <span className={`${styles.badge} ${styles.done}`}>Completed</span>
      </div>

      <h3 className={`${styles.title} ${styles.completedTitle}`}>{task.title}</h3>

      {task.description && <p className={styles.desc}>{task.description}</p>}

      {task.completed_at && (
        <p className={styles.due}>Completed {formatDateTime(task.completed_at)}</p>
      )}

      <div className={styles.actions}>
        <button className={styles.restoreBtn} onClick={() => onRestore(task.id)}>↩ Restore</button>
        <button className={styles.deleteBtn}  onClick={() => onDelete(task)}>Delete</button>
      </div>
    </div>
  );
}

// ── Deleted task card ─────────────────────────────────────────────────────────
export function DeletedTaskCard({ task, onRestore, onDelete }) {
  return (
    <div className={`${styles.card} ${styles.deletedCard} fade-up`}>
      <div className={styles.header}>
        <span className={`${styles.badge} ${styles[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
        <span className={styles.deletedTag}>Deleted</span>
      </div>

      <h3 className={`${styles.title} ${styles.deletedTitle}`}>{task.title}</h3>

      {task.description && <p className={styles.desc}>{task.description}</p>}

      {task.deleted_at && (
        <p className={styles.due}>
          Deleted {formatDateTime(task.deleted_at)} · purges in{' '}
          {Math.max(0, 12 - Math.floor((Date.now() - new Date(task.deleted_at)) / 86400000))}d
        </p>
      )}

      <div className={styles.actions}>
        <button className={styles.restoreBtn} onClick={() => onRestore(task.id)}>↩ Restore</button>
        <button className={styles.deleteBtn}  onClick={() => onDelete(task)}>Delete Forever</button>
      </div>
    </div>
  );
}

export default TaskCard;
