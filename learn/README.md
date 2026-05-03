# AI Code Playground & Explainer 🚀

> **Hackathon demo** — Describe anything in plain English. Claude writes the Node.js code, BrowserPod runs it live in your browser via WebAssembly. Zero cloud servers.

---

## Stack

| Layer | Tech |
|-------|------|
| UI | React 18 + Vite |
| AI | Claude claude-sonnet-4-20250514 (Anthropic API) |
| Runtime | BrowserPod — in-browser sandboxed Node.js via WASM |
| Highlighting | highlight.js |
| Fonts | Syne (UI) + JetBrains Mono (code/terminal) |

---

## Quick Start

```bash
# 1. Clone / copy this project, then:
npm install

# 2. Start the dev server (COOP/COEP headers are set automatically)
npm run dev
```

Open http://localhost:5173

---

## Usage

1. **Get a BrowserPod API key** — sign up at [console.browserpod.io](https://console.browserpod.io)
2. Paste your key into the input at the top-right and click **Boot**
3. Wait for the "Pod Ready ✦" badge to appear (takes ~5 seconds)
4. Type a plain English prompt, e.g.:
   - *"Build a fibonacci generator that prints the first 20 numbers"*
   - *"Create an Express server on port 3000 that returns a random joke as JSON"*
   - *"Write a script that sorts an array of objects by age property"*
5. Press **Ctrl/⌘ + Enter** or click the send button
6. Watch the code appear with syntax highlighting, read the explanation, and see the output live in the BrowserPod terminal

### Server mode
If Claude decides the output is a server (`"type": "server"`), BrowserPod will expose a portal URL. An iframe preview appears in the right panel automatically.

---

## Project Structure

```
ai-code-playground/
├── index.html                    # Entry HTML (fonts)
├── vite.config.js                # COOP/COEP headers for SharedArrayBuffer
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx                  # React root
    ├── App.jsx                   # Main app: Claude API + BrowserPod orchestration
    ├── index.css                 # Global styles + orb/animation keyframes
    └── components/
        ├── CodePanel.jsx         # Syntax-highlighted code + copy button
        ├── ExplanationPanel.jsx  # Bullet-point AI explanation
        ├── TerminalPanel.jsx     # BrowserPod XTerm terminal mount
        └── PreviewPanel.jsx      # iframe portal for Express servers
```

---

## Why COOP/COEP?

BrowserPod uses `SharedArrayBuffer` internally (for WASM threads). This requires the page to be served with:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These are set in `vite.config.js` for both `dev` and `preview` modes.

---

## Notes

- The Claude API is called without an API key from the frontend (handled by the Anthropic SDK's browser-safe endpoint). If you see auth errors, you may need to add `"anthropic-dangerous-direct-browser-access": "true"` to the fetch headers.
- BrowserPod requires a paid API key — get one at console.browserpod.io
- Conversation history is kept in-memory for multi-turn refinement
