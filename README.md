# ⚡ Brow-Code?

> **A coding assistant with a game** - built by Team WASD

Brow-Code? is a unified development environment that merges AI-powered learning tools with competitive coding challenges. It provides an intelligent C++ playground and a real-time multiplayer JavaScript battle arena, all from a single futuristic hub.

🌐 **Live Demo**: [[**brow-code.vercel.app**](https://brow-code.vercel.app/)] <!-- Replace with your hosted URL -->

---

## ✨ Features

### 📚 Learn - AI C++ Playground

An intelligent playground designed for deep learning and rapid prototyping in C++.

| Feature | Description |
|---|---|
| **AI Code Generation** | Describe a problem in plain English - Gemini generates the C++ code |
| **Instant Execution** | Runs C++ directly in your browser via BrowserPod & JSCPP |
| **Algorithm Visualiser** | Step-by-step breakdown of complex logic into readable states |
| **AI Debugger** | Identifies the error line, explains the cause, and proposes a fix |

### 🎮 Game — Multiplayer JS Battle Arena

A competitive arena to test your JavaScript skills against other developers in real time.

| Feature | Description |
|---|---|
| **Multiplayer Rooms** | Create a room, share the link, and battle head-to-head |
| **JS Challenges** | Solve algorithmic puzzles faster than your opponent to win rounds |
| **Sandboxed Execution** | Safe, isolated VM environment for running and judging solutions |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Vite](https://vitejs.dev/) + [React](https://reactjs.org/) |
| AI | [Google Gemini 2.5 Flash](https://ai.google.dev/) |
| Infrastructure | [BrowserPod](https://browserpod.io/) — in-browser Linux pods |
| C++ Interpreter | [JSCPP](https://github.com/Flexi68/JSCPP) |
| Multiplayer | WebSockets (Node.js `ws`) + Node.js `vm` sandbox |
| Fonts | Rajdhani · Share Tech Mono |

---

## 📂 Project Structure

```
Brow-Code/
├── game/              # Multiplayer JS battle arena (server + client)
├── learn/             # C++ AI assistant & playground
├── index.html         # Main hub — Team WASD branded entry point
├── vite.config.js     # Centralised Vite configuration
├── .env               # API keys (never committed — see .gitignore)
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A **Google Gemini** API key — [Get one here](https://aistudio.google.com/)
- A **BrowserPod** API key — [Get one here](https://console.browserpod.io/)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/krithiksharan13/Brow-Code.git
cd Brow-Code

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Then edit .env and fill in your keys:
#   VITE_BP_APIKEY=your_browserpod_key
#   VITE_GEMINI_API_KEY=your_gemini_key

# 4. Start the dev server
npm run dev
```

---

## 🛡️ Security

`.env` files are listed in `.gitignore` and are **never** committed to the repository. Do not share your API keys publicly. See `.env.example` for the required variable names.

---

## 👾 Team WASD

Built with ⚡ for the University of Leeds.

| Name | Email |
|---|---|
| Krithik Sharan Suresh Alagianayagi | mxnp0398@leeds.ac.uk |
| Uday Kiran Reddy Mule | gfqr0053@leeds.ac.uk |
| Haritej Karimisetti | tctn0725@leeds.ac.uk |
| Asjad Moiz Khan | gfqs0308@leeds.ac.uk |
