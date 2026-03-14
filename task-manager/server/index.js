const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const { Op }       = require('sequelize');
const sequelize    = require('./config/db');
require('dotenv').config();

require('./models/User');
require('./models/Task');
require('./models/RefreshToken');

const Task = require('./models/Task');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth',  authRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Auto-purge tasks older than 12 days ───────────────────────────────────────
const PURGE_DAYS = 12;

async function purgeOldTasks() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PURGE_DAYS);
  try {
    const deleted = await Task.destroy({
      where: {
        [Op.or]: [
          { deleted_at:   { [Op.lt]: cutoff, [Op.ne]: null } },
          { completed_at: { [Op.lt]: cutoff, [Op.ne]: null } },
        ],
      },
    });
    if (deleted > 0) console.log(`Purged ${deleted} tasks older than ${PURGE_DAYS} days.`);
  } catch (err) {
    console.error('Purge error:', err.message);
  }
}

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced.');

    // Run purge on startup then every 24 hours
    purgeOldTasks();
    setInterval(purgeOldTasks, 24 * 60 * 60 * 1000);

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('DB sync error:', err));
