# ⚡ Brow-Code? — Team WASD

**A coding assistant with a game.**

Brow-Code? is a unified development environment that merges high-performance learning tools with competitive coding challenges. Built by **Team WASD**, this project provides an AI-powered C++ playground and a real-time multiplayer JavaScript battle arena, all accessible from a single futuristic hub.

---

## 🚀 Features

### 📚 The Assistant (Learn Segment)
An AI-integrated C++ playground designed for deep learning and rapid prototyping.
- **AI-Powered Code Generation**: Describe an algorithm or problem in plain English, and watch Gemini generate high-quality C++ code.
- **Instant Execution**: Runs C++ code directly in your browser using **BrowserPod** and the **JSCPP** interpreter.
- **Step-by-Step Visualization**: The "Algorithm Visualiser" breaks down complex logic into readable states.
- **AI Debugger**: Encountered an error? The assistant identifies the line, explains the cause, and provides a fix.

### 🎮 The Game (Game Segment)
A competitive arena to test your JavaScript skills against other developers.
- **Multiplayer Battles**: Create a room, share the link, and compete in real-time.
- **JS Challenges**: Solve algorithmic puzzles faster than your opponent to win.
- **Sandboxed Execution**: Safe, isolated environment for running and testing game logic.

---

## 🛠️ Tech Stack

- **Core**: [Vite](https://vitejs.dev/), [React](https://reactjs.org/)
- **AI**: [Google Gemini 2.5 Flash](https://ai.google.dev/)
- **Infrastructure**: [BrowserPod](https://browserpod.io/) (for in-browser Linux pods)
- **C++ Interpreter**: [JSCPP](https://github.com/Flexi68/JSCPP)
- **Styling**: Modern CSS with high-tech/gaming aesthetics (Rajdhani & Share Tech Mono fonts)

---

## 📦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- API Keys for:
  - **Google Gemini** (from [Google AI Studio](https://aistudio.google.com/))
  - **BrowserPod** (from [BrowserPod Console](https://console.browserpod.io/))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/krithiksharan13/Brow-Code.git
   cd Brow-Code
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_BP_APIKEY=your_browserpod_key
   VITE_GEMINI_API_KEY=your_gemini_key
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```text
Brow-Code/
├── game/           # JavaScript Multiplayer Game
├── learn/          # C++ AI Assistant & Playground
├── index.html      # Main selection hub (Team WASD Branded)
├── vite.config.js  # Centralized Vite configuration
└── .gitignore      # Protection for node_modules and API keys
```

---

## 🛡️ Security
This project uses a `.gitignore` file to ensure that your private API keys (`.env` files) are **never** pushed to public servers. 

---

## 🤝 Team WASD
Developed with ⚡ by the WASD team.

- **GitHub**: [krithiksharan13](https://github.com/krithiksharan13)
- **Project**: [Brow-Code?](https://github.com/krithiksharan13/Brow-Code.git)
