# AI Code Editor

[![Live Demo](https://img.shields.io/badge/Demo-Run%20Online%20on%20Vercel-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-code-editor-client.vercel.app)

An ultra-modern, high-fidelity, and feature-rich AI-powered code editing platform and desktop IDE. This repository showcases a production-grade, full-stack centerpiece integrating React, Tailwind CSS, Monaco Editor, React Flow, Zustand, Node.js/Express, and Electron.js.

> [!TIP]
> **Live Demo Web App**: You can run the AI Code Editor directly in your browser on Vercel at [ai-code-editor-client.vercel.app](https://ai-code-editor-client.vercel.app)! Note that for AI features online, you simply bring your own Google AI Studio API Key, keeping your usage cost-free and 100% private.

Designed with a secure **Bring Your Own Key (BYOK)** architecture, this IDE operates with **zero remote backend AI costs** by validating and caching credentials strictly client-side via browser `localStorage` and routing streaming requests through a local CORS-free middleware server.

---

## 🌟 Premium Features

The editor is packed with professional features that bring a high-end, responsive feel to desktop and browser code editing:

### 1. Unified Glassmorphic Menu System & HUD
*   **Custom Dropdown Navigation**: Features sleek, glassmorphic dropdowns (**File**, **Edit**, **View**, **Help**) styled with harmony. Built directly inside React, it ensures 100% functionality and consistency on both Web and Electron platforms.
*   **Aesthetic Micro-Notifications**: Integrated with a floating toast notification subsystem that flashes glowing alerts for native saves, download streams, or workspace state shifts.
*   **Command HUD Palette (`Ctrl+Shift+P`)**: A fully responsive fuzzy search palette allowing developers to trigger IDE configurations, swap themes, toggle visual panel sidebars, or clear memory on the fly.

### 2. Multi-Tab Monaco Editor Sandbox
*   **High-fidelity Code Workspace**: Employs the industry-standard Monaco editor engine, featuring syntax highlighting, code autocomplete, indentation settings, and line number tracking.
*   **Auto-Language Detection**: Dynamically changes Monaco syntax coloring based on file extensions (`.js`, `.jsx`, `.ts`, `.tsx`, `.py`, `.css`, `.html`, `.json`, `.md`, and more).
*   **Universal Tab Strip**: Multi-tab scrolling selector with premium Font Awesome file icons and dynamic active indicator lines.

### 3. Advanced AI Core Integrations
*   **Antigravity AI Chat Panel**: A quantum-themed chat assistant utilizing advanced Gemini models. Features include:
    *   *macOS Terminal Code Blocks*: Fenced code blocks styled like macOS terminal cards complete with window control dots, dynamic language headers, and click-to-copy mechanics.
    *   *Diamond Bullet Points*: Formatted lists rendering with glowing violet icons (`fa-solid fa-diamond`) for a sleek visual touch.
    *   *Glassmorphic Callout Cards*: Rich text blockquotes formatted as custom translucent advisory callout cards.
    *   *Thinking Shimmer Indicator*: A custom animated thinking state displaying technical tasks (e.g., "Calibrating neural attention...", "Defying computational gravity...").
*   **Voice-to-Code Assistant ("Vocal Refactor")**: Renders a glowing, pulsing purple microphone inside your prompt bar. Uses native browser Speech Recognition APIs to transcribe spoken prompts into text in real-time.
*   **Multi-Model "AI Arena" Split**: Toggle side-by-side terminal columns to compare streams from **Gemini 2.5 Pro (Precision)** and **Gemini 2.5 Flash (Speed)** concurrently, with a live metrics dashboard tracking Latency (ms), Speed (tokens/sec), and token counts.
*   **AI Diagnostics Scorecard Dashboard**: Slides open a dedicated analysis drawer containing custom circular SVG progress gauges calculating Readability, Performance, and Security percentages. Click any static issue to locate it in Monaco, or hit **Quick Fix** to auto-apply optimized patches!
*   **Time-Travel Snapshot Timeline**: A timeline scrub slider under the tab bar letting you click or drag back through workspace snapshots in real-time. Automatically saves backup restore points before executing any Quick Fixes.
*   **Bidirectional Node Scroll-Linkage**: Selecting logical nodes in the flowchart outline or warning items in the auditor automatically scrolls Monaco and highlights the corresponding code line.
*   **Intent Refactoring Engine**: Focuses your prompt changes on specific development pillars:
    *   🚀 *Performance*: Boost execution speeds and space complexity.
    *   🛡️ *Scalability*: Adapt structural components for high load.
    *   💡 *Readability*: Simplify syntax and add clear docstrings.
    *   🔧 *General Optimization*: Resolve bugs, refactor code, and improve formatting.
*   **Side-by-Side Diff Viewer**: Accept or reject code refactoring proposals using Monaco's native side-by-side diff comparison split screen.
*   **Visual Logic Flowcharts (React Flow)**: Renders code logic blocks, statements, and iterations into visual nodes using custom-styled react-flow canvas blocks.
*   **Decision Memory Sidebar**: Lets developers inject custom architectural requirements directly into the active LLM context, keeping all AI suggestions aligned with their engineering choices.

### 4. Custom Themes & Auto-Updates
*   **8 Premium IDE Themes**: Switch the entire editor's visual palette instantly across 8 dark and light palettes:
    *   🎨 *Dark Plus*: Classic VS Code layout (Default).
    *   🧛 *Dracula*: Vibrant neon accents on deep purple.
    *   ❄️ *Nord*: Arctic blues and frosted slate colors.
    *   🐱 *Catppuccin*: Warm pastel tones.
    *   🔥 *Monokai*: High-contrast neon yellow and green classic.
    *   ☀️ *Solarized Light*: Professional warm paper design.
    *   🌃 *One Dark*: Minimalist gray-black canvas.
    *   🔮 *Cyberpunk*: High-energy magenta and cybernetic teal.
*   **Standalone Update Engine**: Pre-wired with Electron Auto-Updater modules targeting GitHub releases to download and relaunch builds in the background.

---

## 📁 Repository Architecture

This repository is structured as an npm workspaces monorepo, keeping client-side, server-side, and desktop wrappers perfectly organized:

```text
ai-code-editor/
├── client/                     # React Frontend (Vite + Tailwind CSS v3)
│   ├── public/                 # Static public assets
│   ├── index.html              # Main application HTML shell
│   └── src/
│       ├── components/         # Modular layout segments
│       │   ├── ChatPanel/      # Google Antigravity AI chat workspace
│       │   ├── CommandPalette/ # Ctrl+Shift+P fuzzy HUD overlay
│       │   ├── DecisionMemory/ # Custom LLM guidelines panel
│       │   ├── DiffViewer/     # Side-by-side Monaco code comparison
│       │   ├── Editor/         # Monaco Editor wrapper and syntax auto-detection
│       │   ├── ExplainMyCode/  # React Flow logic visualizer
│       │   ├── IntentMode/     # Focus optimization controllers
│       │   ├── Navbar/         # Custom IDE glassmorphic top menu bar and tabs
│       │   └── Sidebar/        # File tree layout and local directory loader
│       ├── pages/              # Primary route viewports (Gate, Settings, History)
│       ├── store/              # Zustand global state manager (useEditorStore.js)
│       ├── themes/             # Visual CSS variable theme declarations
│       └── utils/              # SSE streams and code formatting helpers
├── server/                     # Node.js + Express Backend Proxy Server
│   ├── middleware/             # CORS policies and client access gates
│   ├── routes/                 # Ping checks and proxy routes for Gemini APIs
│   └── index.js                # Server entry point and port allocation
├── electron/                   # Electron Desktop App Wrapper
│   ├── main.js                 # Window creator, native IPC file listeners, app menus
│   ├── preload.js              # Context-isolated secure bridge definitions
│   └── update.js               # AutoUpdater scripts for GitHub Releases
├── package.json (root)         # Monorepo scripts and electron-builder configurations
└── README.md                   # Full product instruction manual
```

---

## 🛠️ Tech Stack & Key Technologies

*   **Frontend**: React (Vite-powered, fast-refresh)
*   **Styling**: Tailwind CSS v3 + Vanilla CSS theme variable bindings
*   **State Management**: Zustand (Minimalist, decoupled global state container)
*   **Code Sandbox**: Monaco Editor (`@monaco-editor/react`)
*   **Visualizations**: React Flow (`@xyflow/react`) for flowchart nodes
*   **Backend Server**: Express (Node.js API handler and request streaming)
*   **Desktop Wrapper**: Electron.js (Context-isolated system hooks and native dialogs)
*   **Bundling & Packaging**: Electron Builder + Vite

---

## 🚀 Getting Started

Follow these step-by-step instructions to download, install, and execute the workspace.

### Prerequisites
*   **Node.js**: [v20.x LTS](https://nodejs.org) or higher.
*   **npm**: v10.x or higher.

### 1. Installation
Clone this repository to your local machine and install all package requirements in a single workspace script:

```bash
# Clone the repository
git clone https://github.com/your-username/ai-code-editor.git
cd ai-code-editor

# Install monorepo dependencies (from root folder)
npm run install:all
```

---

## 💻 Running the Application

You can launch the AI Code Editor in two configurations depending on whether you want a full desktop environment or a browser sandbox:

### 1. Desktop Application Mode (Client + Server + Electron)
Launches the background Express server, triggers Vite's dev server, and spins up Electron's secure native application frame:

```bash
# From workspace root
npm run dev
```

### 2. Web Browser Mode (Client + Server only)
Runs the application purely inside your default browser:

```bash
# From workspace root
npm run dev:web
```

*   **React Frontend Access**: `http://localhost:3000`
*   **Express API Server**: `http://localhost:5000`

---

## 📦 Bundling & Packaging (Creating Downloads)

To compile the React frontend bundle for production and package the Electron wrapper into standalone, distributable installers (`.exe` for Windows, `.dmg` for macOS, or `.AppImage` for Linux), use `electron-builder`:

```bash
# Builds the production client bundle and packages desktop installers
npm run dist
```

After building, you can find the packaged executables inside the newly created `/dist_electron` directory at the project root.

---

## ⌨️ Global Key Bindings & Shortcuts

Enjoy fluid, keyboard-driven navigation with standard IDE keystrokes mapped across both browser and desktop environments:

| Key Combination | Action | Target / Behavior |
| :--- | :--- | :--- |
| **`Ctrl + S`** (or `Cmd + S`) | **Save Active File** | Writes natively to disk (Electron) or triggers a browser file download (Web). |
| **`Ctrl + O`** (or `Cmd + O`) | **Open Folder** | Prompts native directory selection dialogs to import local directory code structures. |
| **`Ctrl + N`** (or `Cmd + N`) | **New File** | Focuses the filename input in the sidebar for sandbox file creation. |
| **`Ctrl + Shift + W`** | **Close Folder** | Closes the current local directory and resets the file tree back to sandbox defaults. |
| **`Ctrl + Shift + P`** | **Command Palette** | Toggles the global Command HUD overlay to change themes, clear caches, or open pages. |
| **`Ctrl + Shift + L`** | **Lock Editor (Logout)** | Instantly purges the saved Gemini API key from browser cache and locks the active session. |
| **`F11`** | **Full Screen** | Toggles full-screen display. |
| **`Ctrl + Z`** / **`Ctrl + Y`** | **Undo / Redo** | Standard code editing undo/redo actions. |

---

## 🔒 Security & BYOK Architecture

*   **Client-Side Security**: No AI API keys are stored on remote servers. They remain strictly in the local environment's browser `localStorage`, ensuring developers retain 100% ownership of their Gemini API access.
*   **Express LLM Proxies**: The Node.js server serves as a localized cors-free proxy. It handles streaming prompts securely and protects against CORS blocks, communicating securely using localized system requests.
*   **Cost-Free Development**: Running on local machine environments eliminates cloud infrastructure fees.

---

## ❓ Troubleshooting FAQ

### 1. Missing or Invalid API Key?
If you get locked out at the startup API gate, make sure you have generated a valid Gemini API key from Google AI Studio. The Gate sends a prompt ping to Google's backend. Once validated, your key is securely saved locally.

### 2. Windows PowerShell Script Blocks (`npm.ps1 cannot be loaded`)?
If your terminal refuses to run the development command due to execution policies, bypass it by running the script directly via `cmd.exe`:
```powershell
cmd /c "npm run dev"
```

### 3. File System Access is disabled inside Web browsers?
When operating in Web Browser Mode, some secure filesystem APIs (like `showDirectoryPicker`) are limited to secure origins (`https` or `localhost`). In other browsers, the editor automatically falls back to standard file uploads (`webkitdirectory` input dialogue) to ensure 100% compatibility.
