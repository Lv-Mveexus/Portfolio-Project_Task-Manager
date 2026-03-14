# TaskFlow — Desktop Task Manager

A cross-platform desktop task manager built with Electron, Node.js/Express, SQLite (Sequelize), and React (Vite).

No database installation required. SQLite is bundled — the database is a single file that lives in the user's app data folder.

## Features

- Cross-platform desktop app (Windows, macOS, Linux)
- Zero external dependencies. SQLite, no MySQL/Postgres needed
- User auth with JWT access tokens + httpOnly refresh token cookies
- Tasks with status, priority, due dates, and overdue highlighting
- Dashboard summary (total, to do, in progress, done, overdue)
- Filter by status, priority, and due date window

---

## Project Structure

```
task-manager/
├── electron/
│   ├── main.js        # Spawns Express server, creates window, injects DB_PATH
│   └── preload.js     # Secure IPC bridge
├── server/            # Express API (Sequelize + SQLite)
├── client/            # React + Vite
├── package.json       # Root — Electron + build scripts
└── README.md
```

---

## Development Setup

### 1. Install server dependencies

```bash
cd server
cp .env.example .env
npm install
```

### 2. Install client dependencies

```bash
cd ../client
npm install
```

### 3. Install root (Electron) dependencies

```bash
cd ..
npm install
```

### 4. Run in development mode

```bash
# From the project root
npm run dev
```

Starts Express, Vite, and Electron together. The SQLite database file (`taskflow.db`) is created automatically at the project root on first run.

---

## Building for Production

```bash
npm run build        # current OS
npm run build:win    # .exe installer (NSIS)
npm run build:mac    # .dmg
npm run build:linux  # .AppImage + .deb
```

Output goes to `dist-electron/`. The packaged app is fully self-contained — users just install and run it. The database file is created in the OS user-data folder on first launch:

- **Windows** — `%APPDATA%\TaskFlow\taskflow.db`
- **macOS** — `~/Library/Application Support/TaskFlow/taskflow.db`
- **Linux** — `~/.config/TaskFlow/taskflow.db`

---

## Adding App Icons

Place icons in `electron/assets/` before building:

| File | Platform | Size |
|------|----------|------|
| `icon.ico` | Windows | 256×256 |
| `icon.icns` | macOS | 512×512 |
| `icon.png` | Linux | 512×512 |

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/signup` | No | Register |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | Cookie | Logout |
| GET | `/api/tasks` | Yes | List tasks (`?status=&priority=&due_filter=`) |
| GET | `/api/tasks/summary` | Yes | Dashboard counts |
| POST | `/api/tasks` | Yes | Create task |
| PUT | `/api/tasks/:id` | Yes | Update task |
| DELETE | `/api/tasks/:id` | Yes | Delete task |
