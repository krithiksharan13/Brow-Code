import React, { useState, useRef, useCallback, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import CodePanel from "./components/CodePanel.jsx";
import ExplanationPanel from "./components/ExplanationPanel.jsx";
import TerminalPanel from "./components/TerminalPanel.jsx";

// ── Orb background ─────────────────────────────────────────────
const ORBS = [
  { size: 420, x: "8%",  y: "12%",  color: "rgba(0,212,255,0.07)",  anim: "orb-float-1", dur: "18s" },
  { size: 300, x: "75%", y: "5%",   color: "rgba(124,58,237,0.09)", anim: "orb-float-2", dur: "22s" },
  { size: 260, x: "55%", y: "60%",  color: "rgba(0,212,255,0.06)",  anim: "orb-float-3", dur: "26s" },
  { size: 200, x: "20%", y: "70%",  color: "rgba(124,58,237,0.07)", anim: "orb-float-4", dur: "20s" },
  { size: 350, x: "85%", y: "50%",  color: "rgba(0,212,255,0.05)",  anim: "orb-float-5", dur: "30s" },
  { size: 180, x: "40%", y: "20%",  color: "rgba(124,58,237,0.06)", anim: "orb-float-6", dur: "24s" },
];

const GEMINI_MODEL = "gemini-2.5-flash";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

// ── System prompt: forces structured JSON output ────────────────
// JSCPP (the in-browser C++ interpreter) does NOT support the std:: namespace
// prefix. All code must use `using namespace std;` and bare names (cout, endl,
// string, vector, etc.) — never std::cout, std::string, std::vector, etc.
const SYSTEM_PROMPT = `You are an expert C++ developer and teacher. When given a prompt, return ONLY a raw JSON object — no markdown fences, no backticks, no preamble, no trailing text whatsoever.

JSON schema (all fields required):
{
  "code": "<complete, self-contained C++ program as a single string>",
  "explanation": ["<bullet 1>", "<bullet 2>", ...]
}

Rules:
- "code" must be a fully runnable C++ program.
- CRITICAL NAMESPACE RULE: You MUST always include "using namespace std;" immediately after your #include lines. NEVER use the std:: prefix anywhere — write cout, cin, endl, string, vector, sort, map, pair, etc. directly, never std::cout, std::string, std::vector, std::sort etc. This is a hard requirement — any std:: prefix will cause a parse error at runtime.
- Always include all necessary #include headers (e.g. <iostream>, <vector>, <string>, <algorithm>, <cmath>, <sstream>, etc.).
- Always use int main() { ... } with return 0; at the end.
- CRITICAL: If the prompt contains specific numbers, words, names, or any text values, embed them DIRECTLY as hardcoded literals inside the code. Never use cin or any runtime input — all values come from the prompt and are baked into the source.
- "explanation" is 4–7 beginner-friendly bullet points in plain English explaining what the code does and how the key parts work.
- Output ONLY the JSON object. Nothing else before or after it.`;

const DEBUG_SYSTEM_PROMPT = `You are an expert C++ debugger. When given a prompt that includes C++ source code, respond with ONLY a raw JSON object with the following keys: error_line, cause, fix_code, explanation.

- error_line: one short line with the location of the error.
- cause: one short line explaining the root cause.
- fix_code: a complete fixed C++ program that compiles and runs.
- explanation: an array of 2-3 short bullet points explaining the fix and the important change.

Do not add any extra text, headers, markdown fences, or formatting outside the JSON object.`;

const EXPLAIN_SYSTEM_PROMPT = `You are an expert C++ explainer. When given C++ source code, respond with a plain-text explanation of what the code does and how its main parts work. Output only sentences or short paragraphs; do not use markdown fences, bullet lists, or headers.`;

const ALGORITHM_SYSTEM_PROMPT = `You are an expert C++ algorithm visualizer and developer. When given a prompt, return ONLY a raw JSON object — no markdown fences, no backticks, no preamble, no trailing text whatsoever.

JSON schema (all fields required):
{
  "code": "<complete, self-contained C++ program as a single string>",
  "explanation": ["<Step 1: state>", "<Step 2: state>", ...]
}

Rules:
- "code" must be a fully runnable C++ program.
- CRITICAL NAMESPACE RULE: You MUST always include "using namespace std;" immediately after your #include lines. NEVER use the std:: prefix anywhere.
- Always include all necessary #include headers.
- Always use int main() { ... } with return 0; at the end.
- "explanation" must be an array of step-by-step states describing how the generated code processes data and evolves through the algorithm. Each item must use the format "Step N: [state]".
- Do not add any explanation, titles, lists, or code outside the JSON object.`;

export default function App() {
  const [bpApiKey, setBpApiKey]       = useState(import.meta.env.VITE_BP_APIKEY || "");
  const [bpStatus, setBpStatus]       = useState("idle"); // idle | booting | ready | error
  const [podRef, setPodRef]           = useState(null);
  const terminalElRef                 = useRef(null);
  // Stores the Terminal object returned by createDefaultTerminal — required by pod.run
  const terminalObjRef                = useRef(null);

  const [prompt, setPrompt]           = useState("");
  // Gemini history: always { role: "user"|"model", parts: [{ text }] }
  const [history, setHistory]         = useState([]);
  const [chips, setChips]             = useState([]);
  const [aiMode, setAiMode]           = useState("generate");
  const [debugOriginalCode, setDebugOriginalCode] = useState("");
  const [highlightedLines, setHighlightedLines]   = useState([]);

  const [loading, setLoading]         = useState(false);
  const [code, setCode]               = useState("");
  const [explanation, setExplanation] = useState([]);
  const [runCount, setRunCount]       = useState(0);
  const [bpError, setBpError]         = useState("");

  // ── Boot BrowserPod ──────────────────────────────────────────
  const bootPod = useCallback(async () => {
    if (!bpApiKey.trim()) return;
    setBpError("");
    setBpStatus("booting");
    try {
      const { BrowserPod } = await import("@leaningtech/browserpod");
      const pod = await BrowserPod.boot({ apiKey: bpApiKey.trim() });

      // createDefaultTerminal returns Promise<Terminal> — must await and store.
      // pod.run needs the Terminal object, not a boolean.
      if (terminalElRef.current) {
        terminalObjRef.current = await pod.createDefaultTerminal(terminalElRef.current);
      }

      // ── Install JSCPP (pure-JS C++ interpreter) once at boot ──
      // BrowserPod only has Node.js — no clang++/g++.
      // JSCPP is a 100% JavaScript C++ interpreter with no native deps.
      setBpStatus("installing");
      const terminal = terminalObjRef.current;

      await pod.createDirectory("/runner", { recursive: true });

      const pkgFile = await pod.createFile("/runner/package.json", "utf-8");
      await pkgFile.write(JSON.stringify({
        name: "cpp-runner",
        version: "1.0.0",
        dependencies: { "JSCPP": "latest" }
      }));
      await pkgFile.close();

      // npm install inside the pod (JSCPP is pure JS — no native binaries)
      await pod.run("npm", ["install", "--prefix", "/runner"], { terminal });

      setPodRef(pod);
      setBpStatus("ready");
    } catch (err) {
      console.error("BrowserPod boot failed:", err);
      setBpStatus("error");
      const message = err?.message || "BrowserPod boot failed.";
      const wsHint = message.includes("WebSocket")
        ? "BrowserPod could not connect over WebSocket. Check your BrowserPod API key and network access."
        : "Check that your BrowserPod API key is correct and your network is available.";
      setBpError(`${message} ${wsHint}`);
    }
  }, [bpApiKey]);

  // ── Auto-boot BrowserPod if API key is present ────────────────
  useEffect(() => {
    if (bpApiKey && bpStatus === "idle") {
      bootPod();
    }
  }, [bpApiKey, bpStatus, bootPod]);

  // ── Call Gemini (JSON mode) ──────────────────────────────────
  const callGemini = useCallback(async (messages, mode = "generate") => {
    const config = {
      systemInstruction:
        mode === "debug"
          ? DEBUG_SYSTEM_PROMPT
          : mode === "explain"
          ? EXPLAIN_SYSTEM_PROMPT
          : mode === "algorithm"
          ? ALGORITHM_SYSTEM_PROMPT
          : SYSTEM_PROMPT,
      responseMimeType:
        mode === "debug" || mode === "explain"
          ? "text/plain"
          : "application/json",
    };

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: messages,
      config,
    });

    const raw = response.text?.trim() ?? "";
    return raw.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/i, "").trim();
  }, []);

  const getChangedLineNumbers = useCallback((original, fixed) => {
    if (!original || !fixed) return [];
    const normalizedOriginal = original.replace(/\r/g, "");
    const normalizedFixed = fixed.replace(/\r/g, "");
    const originalLines = normalizedOriginal.split("\n");
    const fixedLines = normalizedFixed.split("\n");
    const maxLines = Math.max(originalLines.length, fixedLines.length);
    const changed = [];

    for (let index = 0; index < maxLines; index += 1) {
      const originalLine = (originalLines[index] || "").trimEnd();
      const fixedLine = (fixedLines[index] || "").trimEnd();
      if (originalLine !== fixedLine) changed.push(index);
    }

    return changed;
  }, []);

  // ── Run C++ via JSCPP inside BrowserPod ──────────────────────
  // Flow: write main.cpp → write run.js (JSCPP runner) → node run.js
  const executeCode = useCallback(async (codeStr) => {
    if (!podRef || !terminalObjRef.current) return false;
    const terminal = terminalObjRef.current;

    // Safety net: JSCPP doesn't support std:: prefix — strip any that Gemini snuck in.
    // "using namespace std;" is always injected so bare names work fine.
    const sanitized = codeStr
      .replace(/\bstd::/g, "")
      // Ensure "using namespace std;" is present after the last #include
      .replace(/((?:#include\s*<[^>]+>\s*\n)+)(?!using namespace std;)/, "$1using namespace std;\n");

    // Write the C++ source file
    await podRef.createDirectory("/app", { recursive: true });
    const srcFile = await podRef.createFile("/app/main.cpp", "utf-8");
    await srcFile.write(sanitized);
    await srcFile.close();

    // Write a Node.js runner that uses JSCPP to interpret the C++ source
    const runnerScript = `
const JSCPP = require("/runner/node_modules/JSCPP");
const fs    = require("fs");
const code  = fs.readFileSync("/app/main.cpp", "utf-8");
try {
  const exitCode = JSCPP.run(code, "");
  process.exit(typeof exitCode === "number" ? exitCode : 0);
} catch (e) {
  // JSCPP wraps runtime errors — print cleanly
  const msg = e && e.msg ? e.msg : (e.message || String(e));
  process.stderr.write("Runtime error: " + msg + "\\n");
  process.exit(1);
}
`.trim();

    const runFile = await podRef.createFile("/app/run.js", "utf-8");
    await runFile.write(runnerScript);
    await runFile.close();

    // Execute via Node.js — output appears in the terminal panel
    await podRef.run("node", ["/app/run.js"], { terminal });

    setRunCount((n) => n + 1);
    return true;
  }, [podRef]);

  // ── Submit prompt ────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    let trimmed = prompt.trim();
    if (!trimmed && aiMode === "explain") {
      trimmed = code.trim();
    }
    if (!trimmed || loading) return;

    const originalDebugCode = aiMode === "debug"
      ? (() => {
          const codeIndex = trimmed.indexOf("Code:");
          return codeIndex >= 0 ? trimmed.slice(codeIndex + 5).trim() : "";
        })()
      : "";

    if (aiMode === "debug") {
      setDebugOriginalCode(originalDebugCode);
    } else {
      setDebugOriginalCode("");
      setHighlightedLines([]);
    }

    setLoading(true);

    const userMsg  = { role: "user", parts: [{ text: trimmed }] };
    const messages = [...history, userMsg];

    try {
      const result = await callGemini(messages, aiMode);

      setHistory((h) => [...h, userMsg, { role: "model", parts: [{ text: result }] }]);
      setChips((c) => [
        ...c,
        trimmed.length > 32 ? trimmed.slice(0, 30) + "…" : trimmed,
      ]);

      if (aiMode === "debug") {
        let parsed = null;
        try {
          parsed = JSON.parse(result);
        } catch (parseErr) {
          parsed = null;
        }

        if (parsed && typeof parsed === "object") {
          const fixCode = String(parsed.fix_code ?? "").trim();
          const explanationBullets = [
            parsed.error_line ? `Error line: ${parsed.error_line}` : "Error line unavailable.",
            parsed.cause ? `Cause: ${parsed.cause}` : "Cause unavailable.",
            ...(Array.isArray(parsed.explanation)
              ? parsed.explanation
              : parsed.explanation
              ? [String(parsed.explanation)]
              : ["No additional explanation provided."])
          ];

          setCode(fixCode);
          setExplanation(explanationBullets);
          setHighlightedLines(getChangedLineNumbers(originalDebugCode, fixCode));

          if (podRef && bpStatus === "ready" && fixCode) {
            await executeCode(fixCode);
          } else if (fixCode) {
            setExplanation((prev) => [
              ...prev,
              "BrowserPod is not ready, so the fix code was generated but not executed.",
            ]);
          }
        } else {
          setCode("");
          setExplanation([result]);
          setHighlightedLines([]);
        }
      } else if (aiMode === "explain") {
        if (trimmed && trimmed !== code) {
          setCode(trimmed);
        }
        setHighlightedLines([]);
        const explanationBullets = result
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        setExplanation(explanationBullets.length ? explanationBullets : ["No explanation returned."]);
      } else if (aiMode === "algorithm") {
        let parsed = null;
        try {
          parsed = JSON.parse(result);
        } catch (parseErr) {
          parsed = null;
        }

        if (parsed && typeof parsed === "object") {
          const generatedCode = parsed?.code ?? "";
          const explanationBullets = Array.isArray(parsed?.explanation)
            ? parsed.explanation
            : [String(parsed?.explanation ?? "No algorithm steps were returned.")];

          setCode(generatedCode);
          setExplanation(explanationBullets);
          setHighlightedLines([]);

          if (podRef && bpStatus === "ready" && generatedCode) {
            await executeCode(generatedCode);
          } else if (generatedCode) {
            setExplanation((prev) => [
              ...prev,
              "BrowserPod is not ready, so the generated code was not executed.",
            ]);
          }
        } else {
          setCode("");
          setExplanation([result]);
          setHighlightedLines([]);
        }
      } else {
        let parsed = null;
        try {
          parsed = JSON.parse(result);
        } catch (parseErr) {
          parsed = { code: "", explanation: ["Failed to parse Gemini JSON response."] };
        }

        const generatedCode = parsed?.code ?? "";
        const explanationBullets = Array.isArray(parsed?.explanation)
          ? parsed.explanation
          : [String(parsed?.explanation ?? "Generated code.")];

        setCode(generatedCode);
        setExplanation(explanationBullets);
        setHighlightedLines([]);

        if (podRef && bpStatus === "ready" && generatedCode) {
          await executeCode(generatedCode);
        } else if (generatedCode) {
          setExplanation((prev) => [
            ...prev,
            "BrowserPod is not ready, so the code was generated but not executed.",
          ]);
        }
      }

      setPrompt("");
    } catch (err) {
      console.error("Error:", err);
      setExplanation([`❌ ${err.message}`]);
    } finally {
      setLoading(false);
    }
  }, [prompt, history, loading, bpStatus, aiMode, callGemini, podRef, executeCode, getChangedLineNumbers]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  // ── Status badge ─────────────────────────────────────────────
  const statusConfig = {
    idle:       { label: "Not Connected",        color: "#64748b", pulse: false },
    booting:    { label: "Booting…",             color: "#f59e0b", pulse: true  },
    installing: { label: "Installing runtime…",  color: "#f59e0b", pulse: true  },
    ready:      { label: "Pod Ready ✦",          color: "#00ff88", pulse: false },
    error:      { label: "Boot Failed",          color: "#ef4444", pulse: false },
  };
  const status = statusConfig[bpStatus];

  return (
    <div style={styles.root}>
      {/* ── Orb Layer ── */}
      <div style={styles.orbLayer} aria-hidden="true">
        {ORBS.map((o, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: o.size,
              height: o.size,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
              left: o.x,
              top: o.y,
              transform: "translate(-50%, -50%)",
              animation: `${o.anim} ${o.dur} ease-in-out infinite`,
              filter: "blur(2px)",
              pointerEvents: "none",
            }}
          />
        ))}
      </div>

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoMark}>C++</div>
          <div>
            <h1 style={styles.title}>AI C++ Playground</h1>
            <p style={styles.subtitle}>Describe anything. Watch it compile &amp; run.</p>
          </div>
        </div>

        <div style={styles.headerRight}>
          {(bpStatus === "idle" || bpStatus === "error") && (
            <div style={styles.keyColumn}>
              <div style={styles.keyRow}>
                <input
                  style={styles.keyInput}
                  type="password"
                  placeholder="BrowserPod API key (console.browserpod.io)"
                  value={bpApiKey}
                  onChange={(e) => setBpApiKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && bootPod()}
                />
                <button
                  style={{ ...styles.bootBtn, opacity: bpApiKey.trim() ? 1 : 0.5 }}
                  onClick={bootPod}
                  disabled={!bpApiKey.trim()}
                >
                  Boot
                </button>
              </div>
              {bpError && <div style={styles.errorText}>{bpError}</div>}
            </div>
          )}

          <div style={styles.statusBadge}>
            <span
              style={{
                ...styles.statusDot,
                background: status.color,
                boxShadow: `0 0 8px ${status.color}`,
                animation: status.pulse ? "status-pulse 1s ease-in-out infinite" : "none",
              }}
            />
            <span style={{ ...styles.statusLabel, color: status.color }}>
              {status.label}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={styles.main}>
        <div style={styles.leftCol}>
          <CodePanel
            code={code}
            loading={loading}
            highlightedLines={highlightedLines}
            editable
            onCodeChange={(newCode) => {
              setCode(newCode);
              setHighlightedLines([]);
            }}
          />
          <ExplanationPanel bullets={explanation} loading={loading} />
        </div>
        <div style={styles.rightCol}>
          <TerminalPanel
            terminalRef={terminalElRef}
            podStatus={bpStatus}
            runCount={runCount}
          />
        </div>
      </main>

      {/* ── Prompt Bar ── */}
      <footer style={styles.footer}>
        {chips.length > 0 && (
          <div style={styles.chips}>
            {chips.map((c, i) => (
              <span key={i} style={styles.chip}>{c}</span>
            ))}
          </div>
        )}

        <div style={styles.modeRow}>
          <button
            style={{
              ...styles.modeBtn,
              background: aiMode === "generate" ? "rgba(0,212,255,0.16)" : "rgba(255,255,255,0.05)",
              color: aiMode === "generate" ? "#00d4ff" : "#94a3b8",
            }}
            onClick={() => setAiMode("generate")}
            disabled={loading}
          >
            Generate C++
          </button>
          <button
            style={{
              ...styles.modeBtn,
              background: aiMode === "debug" ? "rgba(124,58,237,0.16)" : "rgba(255,255,255,0.05)",
              color: aiMode === "debug" ? "#c084fc" : "#94a3b8",
            }}
            onClick={() => setAiMode("debug")}
            disabled={loading}
          >
            AI Debugger
          </button>
          <button
            style={{
              ...styles.modeBtn,
              background: aiMode === "algorithm" ? "rgba(16,185,129,0.16)" : "rgba(255,255,255,0.05)",
              color: aiMode === "algorithm" ? "#5eead4" : "#94a3b8",
            }}
            onClick={() => setAiMode("algorithm")}
            disabled={loading}
          >
            Algorithm Visualiser
          </button>
          <button
            style={{
              ...styles.modeBtn,
              background: aiMode === "explain" ? "rgba(234,179,8,0.16)" : "rgba(255,255,255,0.05)",
              color: aiMode === "explain" ? "#facc15" : "#94a3b8",
            }}
            onClick={() => setAiMode("explain")}
            disabled={loading}
          >
            Explain Code
          </button>
        </div>

        <div style={styles.inputRow}>
          <textarea
            style={styles.textarea}
            rows={3}
            placeholder={
              aiMode === "debug"
                ? 'Debug this C++ code and return JSON with error_line, cause, fix_code, and explanation. Code: {code}'
                : aiMode === "algorithm"
                ? 'Generate runnable C++ code and visualize its algorithm steps. Describe the algorithm and input, and the app will produce code plus Step 1: [state], Step 2: [state], ...'
                : aiMode === "explain"
                ? 'Paste your C++ code and the app will explain what it does and how its main parts work.'
                : bpStatus === "booting"
                ? "⏳ BrowserPod is booting — please wait…"
                : bpStatus === "installing"
                ? "📦 Installing C++ runtime (JSCPP) — almost ready…"
                : bpStatus !== "ready"
                ? 'Enter a description to generate a runnable C++ program. The app will compile and run it when BrowserPod is ready.'
                : 'Enter a description to generate a runnable C++ program. The app will compile and run it when BrowserPod is ready.'
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            style={{
              ...styles.sendBtn,
              opacity: loading || !prompt.trim() ? 0.4 : 1,
              cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
              animation:
                !loading && prompt.trim()
                  ? "pulse-glow 2s ease-in-out infinite"
                  : "none",
            }}
            onClick={handleSubmit}
            disabled={loading || !prompt.trim()}
          >
            {loading ? (
              <span style={styles.spinner} />
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
        <p style={styles.hint}>
          {bpStatus === "ready"
            ? "⌘/Ctrl+Enter to send · Compiles with clang++ -std=c++17 inside BrowserPod"
            : "Powered by Gemini 2.5 Flash + BrowserPod WebAssembly sandbox"}
        </p>
      </footer>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────
const styles = {
  root: {
    display: "flex", flexDirection: "column",
    height: "100vh", width: "100vw",
    background: "var(--navy)", overflow: "hidden", position: "relative",
  },
  orbLayer: {
    position: "absolute", inset: 0,
    overflow: "hidden", pointerEvents: "none", zIndex: 0,
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 28px", borderBottom: "1px solid var(--border)",
    background: "rgba(10,15,30,0.8)", backdropFilter: "blur(20px)",
    zIndex: 10, flexShrink: 0, gap: 16,
  },
  headerLeft:  { display: "flex", alignItems: "center", gap: 14 },
  logoMark: {
    fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700,
    color: "var(--cyan)", textShadow: "0 0 16px var(--cyan-glow)", letterSpacing: -1,
  },
  title: {
    fontFamily: "var(--font-ui)", fontSize: 22, fontWeight: 800,
    background: "linear-gradient(90deg, #00d4ff, #7c3aed, #00d4ff, #38bdf8)",
    backgroundSize: "300% 300%",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    animation: "title-gradient 5s ease infinite", letterSpacing: -0.5, lineHeight: 1.1,
  },
  subtitle: {
    fontFamily: "var(--font-mono)", fontSize: 11,
    color: "var(--text-muted)", letterSpacing: "0.08em", marginTop: 2,
  },
  headerRight: {
    display: "flex", alignItems: "center", gap: 12,
    flexWrap: "wrap", justifyContent: "flex-end",
  },
  keyRow:   { display: "flex", gap: 8, alignItems: "center" },
  keyInput: {
    background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
    borderRadius: 8, padding: "7px 12px", color: "var(--text)",
    fontFamily: "var(--font-mono)", fontSize: 12, width: 280,
    outline: "none", transition: "border-color 0.2s",
  },
  bootBtn: {
    background: "linear-gradient(135deg, var(--purple), #4f46e5)",
    border: "none", borderRadius: 8, padding: "7px 16px",
    color: "#fff", fontFamily: "var(--font-ui)", fontSize: 13,
    fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em",
    boxShadow: "0 0 16px var(--purple-glow)", transition: "opacity 0.2s",
  },
  statusBadge: {
    display: "flex", alignItems: "center", gap: 7,
    background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
    borderRadius: 20, padding: "5px 12px",
  },
  statusDot:   { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  statusLabel: {
    fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em",
  },
  main:     { display: "flex", flex: 1, overflow: "hidden", zIndex: 1 },
  leftCol:  {
    width: "40%", display: "flex", flexDirection: "column",
    borderRight: "1px solid var(--border)", overflow: "hidden",
  },
  rightCol: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  footer: {
    padding: "12px 24px 14px", borderTop: "1px solid var(--border)",
    background: "rgba(10,15,30,0.9)", backdropFilter: "blur(20px)",
    zIndex: 10, flexShrink: 0,
  },
  chips:  { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 },
  chip: {
    fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--cyan)",
    background: "var(--cyan-dim)", border: "1px solid rgba(0,212,255,0.25)",
    borderRadius: 12, padding: "3px 10px", animation: "fade-in 0.3s ease",
  },
  modeRow: {
    display: "flex",
    gap: 8,
    marginBottom: 10,
  },
  modeBtn: {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "8px 12px",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    cursor: "pointer",
    transition: "background 0.2s, color 0.2s",
  },
  inputRow: { display: "flex", gap: 10, alignItems: "flex-end" },
  textarea: {
    flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "10px 14px", color: "var(--text)",
    fontFamily: "var(--font-ui)", fontSize: 14, resize: "none",
    outline: "none", lineHeight: 1.5, transition: "border-color 0.2s, box-shadow 0.2s",
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 12,
    background: "linear-gradient(135deg, var(--cyan), #0099bb)",
    border: "none", color: "#000",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "opacity 0.2s",
  },
  keyColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  errorText: {
    color: "#f87171",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    lineHeight: 1.4,
    borderRadius: 8,
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.2)",
    padding: "8px 10px",
  },
  spinner: {
    display: "inline-block", width: 18, height: 18,
    border: "2px solid rgba(0,0,0,0.3)", borderTop: "2px solid #000",
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  },
  hint: {
    fontFamily: "var(--font-mono)", fontSize: 10,
    color: "var(--text-muted)", marginTop: 6, letterSpacing: "0.04em",
  },
};