import styles from './DashboardSummary.module.css';

const cards = [
  { key: 'total',       label: 'Total',       color: 'var(--fg-dim)' },
  { key: 'todo',        label: 'To Do',       color: 'var(--todo)'   },
  { key: 'in_progress', label: 'In Progress', color: 'var(--progress)'},
  { key: 'done',        label: 'Done',        color: 'var(--done)'   },
  { key: 'overdue',     label: 'Overdue',     color: 'var(--overdue)'},
];

export default function DashboardSummary({ summary }) {
  if (!summary) return null;
  return (
    <div className={styles.grid}>
      {cards.map(({ key, label, color }, i) => (
        <div
          key={key}
          className={styles.card + ' fade-up'}
          style={{ animationDelay: `${i * 0.06}s`, '--dot': color }}
        >
          <span className={styles.dot} />
          <span className={styles.count} style={{ color }}>
            {summary[key] ?? 0}
          </span>
          <span className={styles.label}>{label}</span>
        </div>
      ))}
    </div>
  );
}
