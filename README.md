<p align="center">
  <img src="src/assets/logo.png" alt="oh-my-gc logo" width="200"/>
</p>

# Oh My GC

**oh-my-gc** is a specialized tracker for Grand Chase, built with **Electron** and **React** for the frontend, and **Python** for the backend. It automates character discovery, dungeon tracking, and performance logging by monitoring the game window.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **Python** (3.9+)
- **NPM** (comes with Node.js)

---

### 🎨 Frontend Setup (Electron)

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

### 🐍 Backend Setup (Python)

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

## 📂 Project Structure

- `src/`: React frontend logic and UI components.
  - `src/assets/`: Static files like icons and the **logo**.
  - `src/pages/`: Main application views.
  - `src/utils/`: Frontend helper functions and API wrappers.
- `backend/`: Python core logic.
  - `backend/main.py`: Main entry point for the backend server and game loop.
  - `backend/game.py`: Image processing and game state logic.
  - `backend/database.py`: SQLite database management.
- `types/`: TypeScript definitions across the project.
- `forge.config.ts`: Configuration for Electron Forge.

## 🛠️ Built With

- **Frontend**: [Electron](https://www.electronjs.org/), [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [Python](https://www.python.org/), [OpenCV](https://opencv.org/), [SQLite](https://www.sqlite.org/)

## 📄 License

This project is licensed under the MIT License - see the `package.json` file for details.
