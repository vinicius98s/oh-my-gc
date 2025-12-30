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

4. **Install Tesseract**
   - Download and install Tesseract from [here](https://github.com/UB-Mannheim/tesseract/wiki)
   - It should be installed in the `/backend/third_party/tesseract-win64` directory

5. **Run the backend (if running separately):**

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
  - `src/assets/`: Static files like icons and the logo.
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

**Key Files:**

- `backend/main.py`: Main entry point for the backend server and game loop
- `backend/game.py`: Image processing and game state logic
- `backend/database.py`: SQLite database management
- `backend/server.py`: HTTP server for frontend communication
- `backend/sse.py`: Server-Sent Events for real-time updates
- `backend/utils.py`: Helper functions

### Communication Architecture

The frontend and backend communicate via:

1. **HTTP API**: RESTful endpoints for data retrieval and updates
2. **Server-Sent Events (SSE)**: Real-time updates for game state changes
3. **IPC (Inter-Process Communication)**: Electron-specific communication

### Testing

Before submitting a PR:

- Test all modified functionality
- Ensure the frontend builds without errors
- Verify backend Python scripts run correctly
- Test the complete user flow

## Troubleshooting

### Common Issues

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
