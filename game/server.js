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
    title: "Reverse a String",
    difficulty: "Easy",
    description: `Write a function solve(str) that takes a string and returns it reversed.

Constraints:
  • str may be empty — return ""
  • Preserve case, spaces, digits, and symbols exactly
  • Return a string (not an array)`,
    examples: [
      { call: 'solve("hello")',   output: '"olleh"',   note: 'basic reverse' },
      { call: 'solve("racecar")', output: '"racecar"', note: 'palindrome — stays the same' },
      { call: 'solve("")',        output: '""',        note: 'empty string' },
    ],
    starterCode: `function solve(str) {
  // Return the reversed string

}`,
    // ── All of these implementations must pass every test:
    //   str.split('').reverse().join('')
    //   [...str].reverse().join('')
    //   Array.from(str).reverse().join('')
    //   for-loop backwards
    //   while-loop
    //   recursion:  s.length <= 1 ? s : solve(s.slice(1)) + s[0]
    //   reduce:     s.split('').reduce((a,c) => c+a, '')
    testCases: [
      { args: ["hello"],        expected: "olleh",       label: "Basic word"       },
      { args: ["racecar"],      expected: "racecar",     label: "Palindrome"       },
      { args: [""],             expected: "",            label: "Empty string"     },
      { args: ["a"],            expected: "a",           label: "Single char"      },
      { args: ["ab"],           expected: "ba",          label: "Two chars"        },
      { args: ["abc"],          expected: "cba",         label: "Three chars (odd)"},
      { args: ["abcd"],         expected: "dcba",        label: "Four chars (even)"},
      { args: ["Hello World"],  expected: "dlroW olleH", label: "With space"       },
      { args: ["a b c"],        expected: "c b a",       label: "Spaced single chars"},
      { args: ["12345"],        expected: "54321",       label: "Digits only"      },
      { args: ["JavaScript"],   expected: "tpircSavaJ",  label: "Mixed case"       },
      { args: ["!@#$%"],        expected: "%$#@!",       label: "Special chars"    },
    ]
  },

  {
    id: 2,
    title: "FizzBuzz",
    difficulty: "Easy",
    description: `Write a function solve(n) that returns an array of strings for numbers 1 through n (inclusive):

  "FizzBuzz"  if divisible by both 3 AND 5
  "Fizz"      if divisible by 3 only
  "Buzz"      if divisible by 5 only
  String(num) for everything else — e.g. "1", "2", "4"

Note: numbers must be returned as strings, not integers.`,
    examples: [
      { call: 'solve(5)',  output: '["1","2","Fizz","4","Buzz"]', note: 'first five entries' },
      { call: 'solve(15)', output: '[ ..., "14", "FizzBuzz" ]',   note: 'first FizzBuzz at 15' },
    ],
    starterCode: `function solve(n) {
  // Return an array of FizzBuzz strings for 1..n

}`,
    // ── All of these implementations must pass every test:
    //   classic if/else in a for loop
    //   Array.from({length: n}, (_, i) => ...) with i+1
    //   [...Array(n)].map((_, i) => ...) with i+1
    //   concatenation trick: (i%3?'':'Fizz')+(i%5?'':'Buzz')||String(i)
    //   recursion
    testCases: [
      { args: [1],  expected: ["1"],                                        label: "n=1, just 1"            },
      { args: [2],  expected: ["1","2"],                                    label: "n=2, no fizz/buzz"      },
      { args: [3],  expected: ["1","2","Fizz"],                             label: "n=3, first Fizz"        },
      { args: [4],  expected: ["1","2","Fizz","4"],                         label: "n=4, strings not ints"  },
      { args: [5],  expected: ["1","2","Fizz","4","Buzz"],                  label: "n=5, first Buzz"        },
      { args: [6],  expected: ["1","2","Fizz","4","Buzz","Fizz"],           label: "n=6, two Fizzes"        },
      { args: [9],  expected: ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz"], label: "n=9, three Fizzes" },
      { args: [10], expected: ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz"], label: "n=10, two Buzzes" },
      { args: [15], expected: [
          "1","2","Fizz","4","Buzz",
          "Fizz","7","8","Fizz","Buzz",
          "11","Fizz","13","14","FizzBuzz"
        ],                                                                   label: "n=15, first FizzBuzz"   },
      { args: [16], expected: [
          "1","2","Fizz","4","Buzz",
          "Fizz","7","8","Fizz","Buzz",
          "11","Fizz","13","14","FizzBuzz","16"
        ],                                                                   label: "n=16, after FizzBuzz"  },
    ]
  }
];

// ── JS Sandbox Execution ──────────────────────────────────────────────────────
// Uses Node's built-in `vm` module — zero dependencies, zero spawning.
// Timeout of 3 seconds catches infinite loops.

function runTestCase(code, args, expected) {
  try {
    const argsLiteral = args.map(a => JSON.stringify(a)).join(", ");
    const script = `
${code}
if (typeof solve !== "function") {
  throw new Error("solve is not defined — make sure your function is named solve");
}
var __result__ = solve(${argsLiteral});
`;
    const sandbox = Object.create(null); // no leaking of Node globals
    vm.runInNewContext(script, sandbox, { timeout: 3000 });

    const actual = JSON.stringify(sandbox.__result__);
    const exp    = JSON.stringify(expected);

    if (actual === exp) return { passed: true };

    const clip = s => s.length > 100 ? s.slice(0, 100) + "…" : s;
    return { passed: false, error: `Expected ${clip(exp)}\nGot     ${clip(actual)}` };

  } catch (err) {
    const msg = String(err.message || err);
    if (msg.toLowerCase().includes("timed out") || msg.includes("Script execution")) {
      return { passed: false, error: "Time Limit Exceeded (3 s)" };
    }
    // Strip noisy internal stack frames from vm
    const clean = msg
      .split("\n")
      .filter(l => !l.includes("at new Script") && !l.includes("runInNew") && !l.includes("node:vm"))
      .join("\n")
      .trim()
      .slice(0, 300);
    return { passed: false, error: clean };
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
let cdTimer = null;

// ── Submission processor ──────────────────────────────────────────────────────
async function processSubmission(side, code) {
  if (state.status !== "playing") return;
  if (state.players[side].status === "testing") return; // already running

  const q = QUESTIONS[state.questionIndex];
  state.players[side] = { status: "testing", testResults: [], error: null, solveTime: null };
  broadcast({ type: "state", state: publicState() });

  const results = [];
  for (const tc of q.testCases) {
    if (state.status !== "playing") break;

    const r = runTestCase(code, tc.args, tc.expected);
    results.push({ passed: r.passed, label: tc.label, error: r.error || null });
    state.players[side].testResults = [...results];
    broadcast({ type: "state", state: publicState() });

    await new Promise(res => setTimeout(res, 55)); // brief pause so dots animate visibly

    if (!r.passed) {
      state.players[side].status = "failed";
      state.players[side].error  = r.error;
      broadcast({ type: "state", state: publicState() });
      return;
    }
  }

  if (state.status !== "playing") return;

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
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function startCountdown() {
  if (cdTimer) { clearInterval(cdTimer); cdTimer = null; }
  state.status    = "countdown";
  state.countdown = 3;
  state.winner    = null;
  state.players   = { left: freshPlayer(), right: freshPlayer() };
  broadcast({ type: "state", state: publicState() });

  cdTimer = setInterval(() => {
    state.countdown--;
    if (state.countdown <= 0) {
      clearInterval(cdTimer); cdTimer = null;
      state.status         = "playing";
      state.roundStartTime = Date.now();
    }
    broadcast({ type: "state", state: publicState() });
  }, 1000);
}

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
const wss = new WebSocket.Server({ server: httpServer, path: "/ws", perMessageDeflate: false });
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
  if (!seats.left)       { seats.left  = ws; mySeat = "left";  }
  else if (!seats.right) { seats.right = ws; mySeat = "right"; }

  send(ws, { type: "welcome", seat: mySeat, state: publicState() });
  if (mySeat === "right" && (state.status === "idle" || state.status === "waiting")) startCountdown();

  ws.on("message", raw => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }
    const side = seats.left === ws ? "left" : seats.right === ws ? "right" : null;

    if (msg.type === "submit_code" && side && state.status === "playing")
      processSubmission(side, msg.code);

    if (msg.type === "next_round" && side && state.status === "round_over") {
      state.questionIndex++;
      state.round++;
      startCountdown();
    }

    if (msg.type === "restart" && side) {
      if (cdTimer) { clearInterval(cdTimer); cdTimer = null; }
      state = freshState();
      seats.left = ws; seats.right = null; mySeat = "left";
      send(ws, { type: "welcome", seat: mySeat, state: publicState() });
      broadcast({ type: "state", state: publicState() });
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    if (seats.left  === ws) seats.left  = null;
    if (seats.right === ws) seats.right = null;
    if (state.status === "playing" || state.status === "countdown") {
      if (cdTimer) { clearInterval(cdTimer); cdTimer = null; }
      state.status = "waiting";
      broadcast({ type: "state", state: publicState() });
    }
  });
});

httpServer.listen(3000, () => console.log("⚡ Code Battle server running on port 3000"));
