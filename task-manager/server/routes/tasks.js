const express = require('express');
const router  = express.Router();
const { Op }  = require('sequelize');
const Task    = require('../models/Task');
const verifyToken = require('../middleware/auth');

const PURGE_DAYS = 12;

router.use(verifyToken);

// ── Helpers ───────────────────────────────────────────────────────────────────
const activeWhere   = (userId) => ({ user_id: userId, deleted_at: null, completed_at: null });
const deletedWhere  = (userId) => ({ user_id: userId, deleted_at:  { [Op.ne]: null } });
const completedWhere= (userId) => ({ user_id: userId, completed_at:{ [Op.ne]: null }, deleted_at: null });

// ── GET /api/tasks — active tasks with filters ────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, priority, due_filter } = req.query;
    const where = activeWhere(req.user.id);

    if (status)   where.status   = status;
    if (priority) where.priority = priority;

    if (due_filter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr    = today.toISOString().split('T')[0];
      const tomorrow    = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const weekOut     = new Date(today);
      weekOut.setDate(weekOut.getDate() + 7);
      const weekOutStr  = weekOut.toISOString().split('T')[0];

      if (due_filter === 'overdue') {
        where.due_date = { [Op.lt]: todayStr };
        where.status   = { [Op.ne]: 'done' };
      } else if (due_filter === 'today') {
        where.due_date = todayStr;
      } else if (due_filter === 'upcoming') {
        where.due_date = { [Op.between]: [tomorrowStr, weekOutStr] };
      }
    }

    const tasks = await Task.findAll({
      where,
      order: [['due_date', 'ASC'], ['createdAt', 'DESC']],
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ── GET /api/tasks/summary ────────────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const userId   = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];

    const [total, todo, in_progress, done, overdue, deleted, completed] =
      await Promise.all([
        Task.count({ where: activeWhere(userId) }),
        Task.count({ where: { ...activeWhere(userId), status: 'todo' } }),
        Task.count({ where: { ...activeWhere(userId), status: 'in_progress' } }),
        Task.count({ where: { ...activeWhere(userId), status: 'done' } }),
        Task.count({ where: {
          ...activeWhere(userId),
          status:   { [Op.ne]: 'done' },
          due_date: { [Op.lt]: todayStr },
        }}),
        Task.count({ where: deletedWhere(userId) }),
        Task.count({ where: completedWhere(userId) }),
      ]);

    res.json({ total, todo, in_progress, done, overdue, deleted, completed });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ── GET /api/tasks/deleted ────────────────────────────────────────────────────
router.get('/deleted', async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: deletedWhere(req.user.id),
      order: [['deleted_at', 'DESC']],
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ── GET /api/tasks/completed ──────────────────────────────────────────────────
router.get('/completed', async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: completedWhere(req.user.id),
      order: [['completed_at', 'DESC']],
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ── POST /api/tasks ───────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority, due_date } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required.' });

    const task = await Task.create({
      title, description, status, priority, due_date,
      user_id: req.user.id,
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ── PUT /api/tasks/:id ────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, user_id: req.user.id, deleted_at: null },
    });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const { title, description, status, priority, due_date } = req.body;
    await task.update({ title, description, status, priority, due_date });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ── PATCH /api/tasks/:id/complete — mark complete, move to completed tab ──────
router.patch('/:id/complete', async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, user_id: req.user.id, deleted_at: null, completed_at: null },
    });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    await task.update({ completed_at: new Date(), status: 'done' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ── PATCH /api/tasks/:id/restore — restore from deleted or completed ──────────
router.patch('/:id/restore', async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    await task.update({ deleted_at: null, completed_at: null, status: 'todo' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ── DELETE /api/tasks/:id — soft delete ───────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    // If already in deleted tab — permanent delete
    if (task.deleted_at) {
      await task.destroy();
      return res.json({ message: 'Permanently deleted.' });
    }

    // Otherwise soft delete
    await task.update({ deleted_at: new Date() });
    res.json({ message: 'Task moved to recently deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ── DELETE /api/tasks/:id/permanent — force permanent delete ──────────────────
router.delete('/:id/permanent', async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    await task.destroy();
    res.json({ message: 'Permanently deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ── DELETE /api/tasks/clear/deleted — clear all deleted ──────────────────────
router.delete('/clear/deleted', async (req, res) => {
  try {
    await Task.destroy({ where: deletedWhere(req.user.id) });
    res.json({ message: 'Deleted tasks cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ── DELETE /api/tasks/clear/completed — clear all completed ──────────────────
router.delete('/clear/completed', async (req, res) => {
  try {
    await Task.destroy({ where: completedWhere(req.user.id) });
    res.json({ message: 'Completed tasks cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
