import styles from './TabBar.module.css';

const TABS = [
  { key: 'active',    label: 'Active',             summaryKey: 'total'     },
  { key: 'completed', label: 'Recently Completed',  summaryKey: 'completed' },
  { key: 'deleted',   label: 'Recently Deleted',    summaryKey: 'deleted'   },
];

export default function TabBar({ active, onChange, summary }) {
  return (
    <div className={styles.bar}>
      {TABS.map((tab) => {
        const count = summary?.[tab.summaryKey] ?? 0;
        return (
          <button
            key={tab.key}
            className={`${styles.tab} ${active === tab.key ? styles.active : ''}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
            {count > 0 && (
              <span className={`${styles.count} ${active === tab.key ? styles.countActive : ''}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
