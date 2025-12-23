# Contributing to Oh My GC

Thank you for your interest in contributing to **Oh My GC**! This document provides technical guidelines and instructions for developers who want to contribute to the project.

## Development Environment Setup

### Prerequisites

- **Node.js** (v18+ recommended)
- **Python** (3.9+)
- **NPM** (comes with Node.js)

---

### Frontend Setup (Electron)

The frontend is built using Electron Forge, React, and Tailwind CSS.

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run in development mode:**

   ```bash
   npm start
   ```

3. **Available Commands:**
   - `npm start`: Starts the application in development mode with hot-reloading.
   - `npm run package`: Packages the application for the local platform.
   - `npm run make`: Creates distributable installers (e.g., `.exe`, `.zip`).
   - `npm run lint`: Runs ESLint to check for code quality issues.

---

### Backend Setup (Python)

The backend handles game state detection using OpenCV and SQLite.

1. **Navigate to the backend directory:**

   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**

   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```

3. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Run the backend (if running separately):**

   ```bash
   python main.py
   ```

---

## Project Architecture

### Frontend (Electron + React)

**Technology Stack:**

- **Electron**: Desktop application framework
- **React**: UI library
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Type-safe JavaScript

**Key Directories:**

- `src/`: React frontend logic and UI components.
  - `src/assets/`: Static files like icons and the **logo**.
  - `src/components/`: Reusable UI components (Button, Modal, DungeonCard, etc.)
  - `src/pages/`: Main application views (Home, Onboarding, Statistics)
  - `src/utils/`: Frontend helper functions and API wrappers
  - `src/DataContext.tsx`: React Context for global state management

**Entry Points:**

- `src/index.html`: Main HTML template
- `src/index.ts`: Renderer process entry point
- `src/preload.ts`: Preload script for IPC communication
- `src/renderer.ts`: React renderer

### Backend (Python)

**Technology Stack:**

- **Python 3.9+**: Core language
- **OpenCV (cv2)**: Image processing and template matching
- **SQLite**: Local database storage
- **FastAPI/Flask**: Web server for API endpoints

**Key Files:**

- `backend/main.py`: Main entry point for the backend server and game loop
- `backend/game.py`: Image processing and game state logic
- `backend/database.py`: SQLite database management
- `backend/server.py`: HTTP server for frontend communication
- `backend/sse.py`: Server-Sent Events for real-time updates
- `backend/utils.py`: Helper functions

**Database Structure:**

The application uses SQLite with the following migrations:

- `backend/migrations/20250703_01_lpcSS-add-characters-table.sql`
- `backend/migrations/20250703_02_nHRg8-add-dungeons-table.sql`
- `backend/migrations/20251214_01_HBiJB-create-character-schedules-table.sql`

### Communication Architecture

The frontend and backend communicate via:

1. **HTTP API**: RESTful endpoints for data retrieval and updates
2. **Server-Sent Events (SSE)**: Real-time updates for game state changes
3. **IPC (Inter-Process Communication)**: Electron-specific communication

## Development Workflow

### Code Style

- **Frontend**: Follow ESLint rules defined in `.eslintrc.json`
- **Backend**: Follow PEP 8 Python style guidelines
- Use TypeScript for all new frontend code
- Add type definitions for any new data structures

### Git Workflow

1. Create a new branch for your feature or bugfix
2. Make your changes following the code style guidelines
3. Test your changes thoroughly
4. Run `npm run lint` before committing
5. Commit with clear, descriptive messages
6. Push and create a pull request

### Testing

Before submitting a PR:

- Test all modified functionality
- Ensure the frontend builds without errors
- Verify backend Python scripts run correctly
- Test the complete user flow

## Adding New Features

### Adding a New Character

1. Add character image to `backend/templates/characters/` and `src/assets/characters/`
2. Add character data to `src/utils/characters.ts`
3. Update database if necessary via migration

### Adding a New Dungeon

1. Add dungeon image to `backend/templates/dungeons/` and `src/assets/dungeons/`
2. Add dungeon data to `src/utils/dungeons.ts`
3. Update database schema if needed

### Adding a New Page/Component

1. Create component in `src/components/` or page in `src/pages/`
2. Follow existing component patterns
3. Use Tailwind CSS for styling
4. Add TypeScript types in `types/` if needed

## Troubleshooting

### Common Issues

**OpenCV not found:**

```bash
pip install opencv-python
```

**Electron not starting:**

- Ensure Node.js v18+ is installed
- Delete `node_modules` and run `npm install` again

**Database locked:**

- Close any running instances of the application
- Check for multiple backend processes

## Built With

- **Frontend**: [Electron](https://www.electronjs.org/), [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [Python](https://www.python.org/), [OpenCV](https://opencv.org/), [SQLite](https://www.sqlite.org/)

## License

This project is licensed under the MIT License - see the `package.json` file for details.
