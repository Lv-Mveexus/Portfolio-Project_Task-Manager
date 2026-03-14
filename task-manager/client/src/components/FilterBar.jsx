import styles from './FilterBar.module.css';

const STATUS_OPTS   = [
  { value: '',            label: 'All Status'   },
  { value: 'todo',        label: 'To Do'        },
  { value: 'in_progress', label: 'In Progress'  },
  { value: 'done',        label: 'Done'         },
];

const PRIORITY_OPTS = [
  { value: '',       label: 'All Priority' },
  { value: 'low',    label: 'Low'          },
  { value: 'medium', label: 'Medium'       },
  { value: 'high',   label: 'High'         },
];

const DUE_OPTS = [
  { value: '',         label: 'Any Date'  },
  { value: 'overdue',  label: 'Overdue'   },
  { value: 'today',    label: 'Today'     },
  { value: 'upcoming', label: 'Upcoming'  },
];

export default function FilterBar({ filters, onChange, onNewTask }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return (
    <div className={styles.bar}>
      <div className={styles.filters}>
        <select value={filters.status}     onChange={set('status')}>
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filters.priority}   onChange={set('priority')}>
          {PRIORITY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filters.due_filter} onChange={set('due_filter')}>
          {DUE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <button className={styles.newBtn} onClick={onNewTask}>
        + New Task
      </button>
    </div>
  );
}
