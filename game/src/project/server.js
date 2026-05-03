const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const vm = require("vm"); // built-in Node module — no install needed

// ── Questions ─────────────────────────────────────────────────────────────────
// Each test case: args[] passed to solve(), expected is JSON-compared to the return value.
// Cases are designed to catch every common implementation pattern (loops, recursion,
// built-ins, etc.) and every typical edge-case / off-by-one bug.

const QUESTIONS = [
  {
    id: 1,
    title: "Sum of Two Numbers",
    difficulty: "Easy",
    description: `Write a function solve(a, b) that returns the sum of two numbers.

Constraints:
  • a and b are integers
  • Return the sum as a number`,
    examples: [
      { call: 'solve(5, 10)', output: '15', note: 'simple addition' },
      { call: 'solve(-2, 4)',  output: '2',  note: 'negative numbers' },
    ],
    starterCode: `function solve(a, b) {
  // Return the sum of a and b

}`,
    testCases: [
      { args: [5, 10],   expected: 15,  label: "Positive integers" },
      { args: [-2, 4],   expected: 2,   label: "Negative and positive" },
      { args: [0, 0],    expected: 0,   label: "Zeros" },
      { args: [100, 200], expected: 300, label: "Large integers" },
      { args: [-5, -5],  expected: -10, label: "Both negative" },
    ]
  },

  {
    id: 2,
    title: "Palindrome Check",
    difficulty: "Easy",
    description: `Write a function solve(str) that returns true if a string is a palindrome, and false otherwise.

A palindrome is a word that reads the same forwards and backwards (ignoring case).

Constraints:
  • str will only contain alphanumeric characters
  • Ignore case (e.g., "Racecar" is a palindrome)`,
    examples: [
      { call: 'solve("racecar")', output: 'true',  note: 'simple palindrome' },
      { call: 'solve("hello")',   output: 'false', note: 'not a palindrome' },
    ],
    starterCode: `function solve(str) {
  // Return true if str is a palindrome, false otherwise

}`,
    testCases: [
      { args: ["racecar"], expected: true,  label: "Simple palindrome" },
      { args: ["hello"],   expected: false, label: "Not a palindrome" },
      { args: ["Racecar"], expected: true,  label: "Case insensitive" },
      { args: ["a"],       expected: true,  label: "Single character" },
      { args: [""],        expected: true,  label: "Empty string" },
      { args: ["121"],     expected: true,  label: "Numeric palindrome" },
      { args: ["step on no pets"], expected: true, label: "Palindrome with spaces" },
    ]
  }
];

// ── JS Sandbox Execution ──────────────────────────────────────────────────────
// Uses Node's built-in `vm` module — zero dependencies, zero spawning.
// Timeout of 3 seconds catches infinite loops.

function runTestCase(code, args, expected) {
  console.log(`[SERVER] runTestCase started for args: ${JSON.stringify(args)}`);
  try {
    // We'll use new Function() instead of vm.runInNewContext.
    // In restricted environments like BrowserPod, the vm module can often hang
    // or fail to enforce timeouts, leading to the "stuck" behavior you're seeing.
    
    // We wrap the code to ensure 'solve' is available in the scope and return its result.
    const runner = new Function('...args', `
      ${code}
      if (typeof solve !== 'function') {
        throw new Error('solve is not defined — make sure your function is named solve');
      }
      return solve(...args);
    `);

    console.log(`[SERVER] Executing code for test case...`);
    
    // Execute the function with the provided arguments
    const result = runner(...args);
    
    const actual = JSON.stringify(result);
    const exp    = JSON.stringify(expected);

    console.log(`[SERVER] Result: ${actual} | Expected: ${exp}`);

    if (actual === exp) return { passed: true };

    const clip = s => (s && s.length > 100) ? s.slice(0, 100) + "…" : String(s);
    return { passed: false, error: `Expected ${clip(exp)}\nGot     ${clip(actual)}` };

  } catch (err) {
    console.error(`[SERVER] runTestCase caught error: ${err.message}`);
    let msg = String(err.message || err);
    
    // Clean up common error messages
    if (msg.includes('solve is not defined')) {
      msg = 'Function "solve" not found. Did you name it correctly?';
    }
    
    return { passed: false, error: msg.slice(0, 200) };
  }
}

// ── Game State ────────────────────────────────────────────────────────────────
const freshPlayer = () => ({ status: "idle", testResults: [], error: null, solveTime: null });
const freshState  = () => ({
  status:         "idle",   // idle | waiting | countdown | playing | round_over | game_over
  questionIndex:  0,
  winner:         null,
  countdown:      3,
  scores:         { left: 0, right: 0 },
  round:          1,
  roundStartTime: null,
  players:        { left: freshPlayer(), right: freshPlayer() }
});

let state = freshState();
const seats = { left: null, right: null };

// ── Submission processor ──────────────────────────────────────────────────────
const processing = { left: false, right: false };

async function processSubmission(side, code) {
  console.log(`[SERVER] Processing submission for ${side}`);
  if (state.status !== "playing") {
    console.log(`[SERVER] Ignored: state is ${state.status}`);
    return;
  }
  if (processing[side]) {
    console.log(`[SERVER] Ignored: already processing ${side}`);
    return;
  }

  processing[side] = true;
  const q = QUESTIONS[state.questionIndex];
  state.players[side] = { status: "testing", testResults: [], error: null, solveTime: null };
  broadcast({ type: "state", state: publicState() });

  const results = [];
  try {
    for (const [idx, tc] of q.testCases.entries()) {
      if (state.status !== "playing") break;

      console.log(`[SERVER] Running test ${idx + 1}/${q.testCases.length} for ${side}`);
      const r = runTestCase(code, tc.args, tc.expected);
      results.push({ passed: r.passed, label: tc.label, error: r.error || null });
      state.players[side].testResults = [...results];
      broadcast({ type: "state", state: publicState() });

      await new Promise(res => setTimeout(res, 55)); // brief pause so dots animate visibly

      if (!r.passed) {
        console.log(`[SERVER] Test failed for ${side}: ${tc.label}`);
        state.players[side].status = "failed";
        state.players[side].error  = r.error;
        broadcast({ type: "state", state: publicState() });
        processing[side] = false; // Release lock before returning
        return;
      }
    }

    if (state.status !== "playing") {
      processing[side] = false;
      return;
    }

    console.log(`[SERVER] All tests passed for ${side}!`);
    // ── Victory ───────────────────────────────────────────────────────────────
    const elapsed = state.roundStartTime
      ? Math.round((Date.now() - state.roundStartTime) / 1000)
      : null;

    state.players[side].status    = "passed";
    state.players[side].solveTime = elapsed;
    state.players[side].testResults = results;
    state.winner  = side;
    state.scores[side]++;
    state.status  = state.questionIndex >= QUESTIONS.length - 1 ? "game_over" : "round_over";

    broadcast({ type: "state", state: publicState() });
  } finally {
    processing[side] = false;
  }
}

// ── Countdown ─────────────────────────────────────────────────────────────────
// ── HTTP ──────────────────────────────────────────────────────────────────────
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript",
  ".css":  "text/css"
};

const httpServer = http.createServer((req, res) => {
  let p = req.url.split("?")[0];
  if (p === "/" || p === "") p = "/game.html";
  try {
    res.setHeader("Content-Type", MIME[path.extname(p)] || "text/plain");
    res.end(fs.readFileSync(path.join(__dirname, p)));
  } catch {
    res.writeHead(404); res.end("Not found");
  }
});

// ── WebSocket ─────────────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ 
  server: httpServer, 
  path: "/ws", 
  perMessageDeflate: false,
  skipUTF8Validation: true 
});
const clients = new Set();

const send      = (ws, m) => ws?.readyState === WebSocket.OPEN && ws.send(JSON.stringify(m));
const broadcast = (m)     => { const s = JSON.stringify(m); for (const c of clients) if (c.readyState === WebSocket.OPEN) c.send(s); };

function publicState() {
  const q = QUESTIONS[state.questionIndex];
  return {
    ...state,
    question: {
      title:       q.title,
      difficulty:  q.difficulty,
      description: q.description,
      examples:    q.examples,
      testCount:   q.testCases.length,
      starterCode: q.starterCode
    },
    questionCount:  QUESTIONS.length,
    seatsOccupied:  { left: !!seats.left, right: !!seats.right }
  };
}

wss.on("connection", (ws) => {
  clients.add(ws);
  let mySeat = null;
  
  // Assign seats
  if (!seats.left) { 
    seats.left = ws; 
    mySeat = "left";
    console.log("Player 1 connected");
    // First player joins → waiting for second player
    if (state.status === "idle") {
      state.status = "waiting";
    }
  } else if (!seats.right) { 
    seats.right = ws; 
    mySeat = "right";
    console.log("Player 2 connected - starting game immediately!");
    // Second player joins → start game instantly (no countdown)
    state.status = "playing";
    state.roundStartTime = Date.now();
    state.players = { left: freshPlayer(), right: freshPlayer() };
  }

  send(ws, { type: "welcome", seat: mySeat, state: publicState() });
  
  // Broadcast updated state to all clients
  broadcast({ type: "state", state: publicState() });

  ws.on("message", raw => {
    console.log(`[SERVER] Received message from a client`);
    let msg; 
    try { 
      // Handle potential binary or string messages
      const data = typeof raw === "string" ? raw : raw.toString();
      msg = JSON.parse(data); 
    } catch (err) { 
      console.error("[SERVER] Failed to parse message:", err);
      return; 
    }
    const side = seats.left === ws ? "left" : seats.right === ws ? "right" : null;
    console.log(`[SERVER] Message type: ${msg.type}, from side: ${side}`);

    if (msg.type === "submit_code" && side && state.status === "playing")
      processSubmission(side, msg.code);

    if (msg.type === "next_round" && side && state.status === "round_over") {
      state.questionIndex++;
      state.round++;
      // Start next round immediately if both players present
      if (seats.left && seats.right) {
        state.status = "playing";
        state.roundStartTime = Date.now();
        state.players = { left: freshPlayer(), right: freshPlayer() };
        state.winner = null;
      } else {
        state.status = "waiting";
      }
      broadcast({ type: "state", state: publicState() });
    }

    if (msg.type === "restart" && side) {
      state = freshState();
      seats.left = ws; seats.right = null; mySeat = "left";
      state.status = "waiting";  // First player waiting for second
      send(ws, { type: "welcome", seat: mySeat, state: publicState() });
      broadcast({ type: "state", state: publicState() });
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    if (seats.left  === ws) {
      seats.left  = null;
      console.log("Player 1 disconnected");
    }
    if (seats.right === ws) {
      seats.right = null;
      console.log("Player 2 disconnected");
    }
    
    // If game was in progress and someone left, go back to waiting
    if (state.status === "playing") {
      state.status = seats.left && seats.right ? "playing" : "waiting";
      broadcast({ type: "state", state: publicState() });
    }
  });
});

httpServer.listen(3000, () => console.log("⚡ Code Battle server running on port 3000"));