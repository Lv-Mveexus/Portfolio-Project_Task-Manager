import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import DashboardSummary from '../components/DashboardSummary';
import FilterBar from '../components/FilterBar';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import styles from './Dashboard.module.css';

const DEFAULT_FILTERS = { status: '', priority: '', due_filter: '' };

export default function Dashboard() {
  const [tasks,    setTasks]   = useState([]);
  const [summary,  setSummary] = useState(null);
  const [filters,  setFilters] = useState(DEFAULT_FILTERS);
  const [modal,    setModal]   = useState(null);   // null | 'new' | task object
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState('');

  const fetchAll = useCallback(async () => {
    setError('');
    try {
      const params = {};
      if (filters.status)     params.status     = filters.status;
      if (filters.priority)   params.priority   = filters.priority;
      if (filters.due_filter) params.due_filter = filters.due_filter;

      const [tasksRes, summaryRes] = await Promise.all([
        api.get('/tasks',         { params }),
        api.get('/tasks/summary'),
      ]);
      setTasks(tasksRes.data);
      setSummary(summaryRes.data);
    } catch {
      setError('Failed to load tasks. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async (form) => {
    if (modal && modal !== 'new') {
      await api.put(`/tasks/${modal.id}`, form);
    } else {
      await api.post('/tasks', form);
    }
    fetchAll();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    fetchAll();
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>

          <div className={styles.pageHeader}>
            <h1 className={styles.heading}>My Tasks</h1>
            <p className={styles.sub}>
              {summary ? `${summary.total} task${summary.total !== 1 ? 's' : ''}` : ''}
            </p>
          </div>

          <DashboardSummary summary={summary} />

          <FilterBar
            filters={filters}
            onChange={setFilters}
            onNewTask={() => setModal('new')}
          />

          {error && <div className={styles.error}>{error}</div>}

          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : tasks.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📋</span>
              <p>No tasks found.</p>
              <button className={styles.emptyBtn} onClick={() => setModal('new')}>
                Create your first task
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {tasks.map((t, i) => (
                <div key={t.id} style={{ animationDelay: `${i * 0.05}s` }}>
                  <TaskCard
                    task={t}
                    onEdit={(task) => setModal(task)}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {modal && (
        <TaskModal
          task={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
