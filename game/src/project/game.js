// ── Helpers ───────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const C = s  => s === "left" ? "L" : s === "right" ? "R" : s[0].toUpperCase() + s.slice(1);
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

let ovCb = null;

// ── WebSocket ─────────────────────────────────────────────────────────────────
const proto = location.protocol === "https:" ? "wss" : "ws";
const ws = new WebSocket(`${proto}://${location.host}/ws`);

// Initial connecting state
showOv("⚡ CODE BATTLE", "Connecting to server…", "var(--c)");

let gs      = null;   // full game state from server
let mySeat  = null;   // "left" | "right" | null (spectator)
const edQi  = { left: -1, right: -1 }; // which question index each editor was last initialised for

ws.addEventListener("message", (e) => {
  try {
    const msg = JSON.parse(e.data);
    console.log(`[CLIENT] Received ${msg.type} from server`);
    if (msg.type === "welcome") {
      mySeat = msg.seat;
      gs = msg.state;
      console.log(`[CLIENT] Assigned seat: ${mySeat}`);
      initEditors();
      render();
    }
    if (msg.type === "state") {
      const prev = gs?.status;
      gs = msg.state;
      console.log(`[CLIENT] State update: ${gs.status}`);
      if (gs.status === "playing" && prev !== "playing") initEditors();
      render();
    }
  } catch (err) {
    console.error("[CLIENT] Error processing message:", err);
  }
});

ws.addEventListener("close", () => {
  showOv("DISCONNECTED", "Connection lost — please refresh.", "#ff2d55");
});

// ── Editor init ───────────────────────────────────────────────────────────────
function initEditors() {
  try {
    if (!gs?.question?.starterCode) return;
    const qi = gs.questionIndex;
    for (const s of ["left","right"]) {
      if (edQi[s] !== qi) {
        const ta = $(`ta${C(s)}`);
        if (ta) {
          ta.value = gs.question.starterCode;
          edQi[s] = qi;
          updateLn(s);
        }
      }
    }
  } catch (err) {
    console.error("initEditors error:", err);
  }
}

// Shared tab-key + scroll sync setup
for (const S of ["L","R"]) {
  const ta = $("ta" + S);
  const ln = $("ln" + S);
  if (!ta || !ln) {
    console.warn(`Element ta${S} or ln${S} not found`);
    continue;
  }
  const side = S === "L" ? "left" : "right";

  ta.addEventListener("keydown", e => {
    if (e.key === "Tab") {
      e.preventDefault();
      const st = ta.selectionStart, en = ta.selectionEnd;
      ta.value = ta.value.slice(0, st) + "    " + ta.value.slice(en);
      ta.selectionStart = ta.selectionEnd = st + 4;
    }
  });
  ta.addEventListener("input", () => updateLn(side));
  ta.addEventListener("scroll", () => { ln.scrollTop = ta.scrollTop; });
}

function updateLn(side) {
  const ta = $(`ta${C(side)}`);
  const ln = $(`ln${C(side)}`);
  if (!ta || !ln) return;
  const n  = ta.value.split("\n").length;
  // Only rebuild if count changed
  if (parseInt(ln.dataset.lines || "0") !== n) {
    ln.textContent  = Array.from({ length: n }, (_, i) => i + 1).join("\n");
    ln.dataset.lines = n;
  }
}

// ── Submit ────────────────────────────────────────────────────────────────────
function submit(side) {
  console.log(`[CLIENT] Attempting submit for ${side}. mySeat: ${mySeat}, status: ${gs?.status}`);
  if (mySeat !== side || !gs || gs.status !== "playing") return;
  if (ws.readyState !== WebSocket.OPEN) {
    console.error("[CLIENT] WebSocket is not open!");
    return;
  }
  if (gs.players[side].status === "testing") return;

  const code = $(`ta${C(side)}`).value;
  console.log(`[CLIENT] Sending submit_code for ${side}`);
  ws.send(JSON.stringify({ type: "submit_code", code }));
}

// ── Main render ───────────────────────────────────────────────────────────────
function render() {
  try {
    if (!gs) return;
    renderHeader();
    renderQuestion();
    renderPanel("left");
    renderPanel("right");
    renderOverlay();
  } catch (err) {
    console.error("Render error:", err);
  }
}

function renderHeader() {
  $("hQ").textContent  = gs.question ? `Q${gs.questionIndex + 1}: ${gs.question.title}` : "–";
  $("hR").textContent  = `ROUND ${gs.round || 1} / ${gs.questionCount || 2}`;
  $("hSL").textContent = gs.scores.left;
  $("hSR").textContent = gs.scores.right;
}

function renderQuestion() {
  const q = gs.question; if (!q) return;
  $("qTitle").textContent = q.title;
  const d = $("qDiff");
  d.textContent = q.difficulty; d.className = `q-diff ${q.difficulty}`;
  $("qDesc").textContent  = q.description;
  $("qTc").textContent    = `⬡ ${q.testCount} test cases`;

  const exsEl = $("qExs"); exsEl.innerHTML = "";
  (q.examples || []).forEach((ex, i) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <div class="q-ex-hdr">Example ${i+1}</div>
      <div class="q-ex">
        <div class="q-ex-io"><span>→ </span>${esc(ex.call)}</div>
        <div class="q-ex-io"><span>← </span>${esc(ex.output)}</div>
        ${ex.note ? `<div class="q-ex-note">// ${esc(ex.note)}</div>` : ""}
      </div>`;
    exsEl.appendChild(div);
  });
}

function renderPanel(side) {
  const S   = C(side);
  const p   = gs.players[side];
  const isMe = mySeat === side;
  const isOpp = mySeat && !isMe;

  // YOU badge
  $(`yt${S}`).style.display = isMe ? "inline" : "none";

  // Status pill
  const pill = $(`sp${S}`);
  const labels = { idle:"READY", testing:"TESTING…", passed:"✓ SOLVED", failed:"✗ FAILED", error:"✗ ERROR" };
  pill.textContent = labels[p.status] || p.status.toUpperCase();
  pill.className   = `sp ${p.status}`;

  // Textarea
  const ta = $(`ta${S}`);
  ta.disabled = !isMe || gs.status !== "playing";

  // Lock overlay for opponent during play
  $(`lk${S}`).className = `lock${isOpp && gs.status === "playing" ? " on" : ""}`;

  // Run button
  const btn = $(`bn${S}`);
  const canRun = isMe && gs.status === "playing" && p.status !== "testing" && p.status !== "passed";
  btn.disabled = !canRun;
  btn.className = `run-btn${p.status === "testing" ? " running" : ""}`;

  // Test dots
  const td = $(`td${S}`); td.innerHTML = "";
  const total = gs.question?.testCount || 0;
  const done  = p.testResults?.length  || 0;

  (p.testResults || []).forEach((r, i) => {
    td.appendChild(makeDot(
      r.passed ? "pass" : "fail",
      r.label + (r.passed ? ": PASS" : (r.error ? `\n${r.error}` : ": FAIL"))
    ));
  });

  // Pending dots
  if (p.status === "testing" || p.status === "idle") {
    const pending = p.status === "testing" ? total - done : 0;
    for (let i = 0; i < pending; i++) {
      const isCurrent = p.status === "testing" && i === 0;
      td.appendChild(makeDot(isCurrent ? "run" : "", `Test ${done + i + 1}: pending`));
    }
  }

  // Error message
  $(`er${S}`).textContent = (p.status === "failed" || p.status === "error") && p.error ? p.error : "";
}

function makeDot(cls, title) {
  const d = document.createElement("div");
  d.className = `dot ${cls}`.trim();
  d.title = title;
  return d;
}

// ── Overlay ───────────────────────────────────────────────────────────────────
function showOv(title, sub, color = "var(--c)", extraHtml = "", btnTxt = "", btnCls = "c", cb = null) {
  $("ov").classList.remove("gone");
  const t = $("ovT"); t.textContent = title; t.style.color = color;
  $("ovS").textContent = sub;
  $("ovX").innerHTML   = extraHtml;

  const btn = $("ovB");
  if (btnTxt && cb) {
    btn.textContent = btnTxt;
    btn.className   = `ov-btn ${btnCls}`;
    btn.style.display = "block";
    if (ovCb) btn.removeEventListener("click", ovCb);
    ovCb = cb;
    btn.addEventListener("click", ovCb, { once: true });
  } else {
    btn.style.display = "none";
  }
}

function hideOv() { $("ov").classList.add("gone"); }

function renderOverlay() {
  const s = gs.status;

  if (s === "idle") {
    showOv("⚡ CODE BATTLE", "Connecting…", "var(--c)");
    return;
  }

  if (s === "waiting") {
    showOv("⏳ WAITING", "Waiting for Player 2 to join…", "var(--y)",
      `<div class="ov-share">
        Share this link with your opponent:
        <span class="url" id="shareUrl">${location.href}</span>
        <button class="copy-btn" onclick="copyLink()">COPY</button>
      </div>`
    );
    return;
  }

  if (s === "countdown") {
    showOv("GET READY", "", "var(--y)",
      gs.countdown > 0
        ? `<div class="ov-cd">${gs.countdown}</div>`
        : `<div class="ov-go">GO!</div>`
    );
    return;
  }

  if (s === "playing") {
    hideOv();
    return;
  }

  if (s === "round_over") {
    const w       = gs.winner;
    const wColor  = w === "left" ? "var(--c)" : "var(--m)";
    const iWon    = mySeat === w;
    const title   = mySeat ? (iWon ? "🎉 YOU WIN!" : "😢 YOU LOSE!") : `${w?.toUpperCase()} WINS!`;
    const tColor  = iWon ? "var(--g)" : mySeat ? "var(--r)" : wColor;
    const st      = gs.players[w]?.solveTime;

    showOv(title, "", tColor,
      `<div class="ov-badge ${w}">${w === "left" ? "PLAYER 1" : "PLAYER 2"} WINS ROUND ${gs.round}</div>
       ${st != null ? `<div class="ov-time">Solved in <b>${st}s</b></div>` : ""}
       <div class="ov-score">Score: <b>${gs.scores.left} — ${gs.scores.right}</b></div>`,
      "▶ NEXT QUESTION", "c",
      () => ws.send(JSON.stringify({ type: "next_round" }))
    );
    return;
  }

  if (s === "game_over") {
    const ls = gs.scores.left, rs = gs.scores.right;
    let title, color, result;
    if      (ls > rs) { title = mySeat === "left"  ? "🏆 VICTORY!" : mySeat === "right" ? "💀 DEFEATED" : "PLAYER 1 WINS"; color = "var(--c)"; result = "Player 1 wins the match"; }
    else if (rs > ls) { title = mySeat === "right" ? "🏆 VICTORY!" : mySeat === "left"  ? "💀 DEFEATED" : "PLAYER 2 WINS"; color = "var(--m)"; result = "Player 2 wins the match"; }
    else              { title = "🤝 IT'S A DRAW!"; color = "var(--y)"; result = "Nobody wins"; }

    showOv(title, "", color,
      `<div class="ov-match" style="color:${color}">${result.toUpperCase()}</div>
       <div class="ov-score">Final score: <b>${ls} — ${rs}</b></div>`,
      "🔄 PLAY AGAIN", "y",
      () => ws.send(JSON.stringify({ type: "restart" }))
    );
    return;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function copyLink() {
  const url = document.getElementById("shareUrl")?.textContent || location.href;
  navigator.clipboard.writeText(url).then(() => {
    const b = document.querySelector(".copy-btn");
    if (b) { b.textContent = "COPIED!"; setTimeout(() => b.textContent = "COPY", 2000); }
  });
}