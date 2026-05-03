import React, { useEffect, useMemo, useRef, useState } from "react";

const BASE_PROMPT = [
  "Welcome to the CheerpJ-style game console!",
  "Type 'help' for commands.",
  "Try 'play' to start a number guessing game.",
];

const HELP_TEXT = [
  "help - show commands",
  "play - start a guessing game",
  "guess <number> - make a guess while playing",
  "reset - restart the console session",
];

function formatMessage(message, type = "system") {
  return { text: message, type, id: `${type}-${Date.now()}-${Math.random()}` };
}

export default function GameConsolePanel() {
  const [history, setHistory] = useState(() => BASE_PROMPT.map((text) => formatMessage(text, "system")));
  const [input, setInput] = useState("");
  const [gameState, setGameState] = useState({ active: false, target: null, tries: 0, maxTries: 5 });
  const consoleRef = useRef(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [history]);

  const status = useMemo(() => {
    if (!gameState.active) return "READY";
    return `GUESS ${gameState.tries}/${gameState.maxTries}`;
  }, [gameState]);

  const append = (message, type = "system") => {
    setHistory((prev) => [...prev, formatMessage(message, type)]);
  };

  const resetSession = () => {
    setHistory(BASE_PROMPT.map((text) => formatMessage(text, "system")));
    setGameState({ active: false, target: null, tries: 0, maxTries: 5 });
    setInput("");
  };

  const startGame = () => {
    const target = Math.floor(Math.random() * 20) + 1;
    setGameState({ active: true, target, tries: 0, maxTries: 5 });
    append("A number between 1 and 20 has been chosen. Use guess <number>.", "system");
  };

  const handleCommand = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    append(`> ${trimmed}`, "input");
    const [command, ...rest] = trimmed.toLowerCase().split(" ");
    const arg = rest.join(" ");

    if (command === "help") {
      HELP_TEXT.forEach((line) => append(line, "system"));
    } else if (command === "play") {
      if (gameState.active) {
        append("Game already running. Use guess <number> or reset.", "system");
      } else {
        startGame();
      }
    } else if (command === "guess") {
      if (!gameState.active) {
        append("No active game. Type 'play' to begin.", "system");
        return;
      }
      const guess = Number(arg);
      if (!Number.isInteger(guess) || guess < 1 || guess > 20) {
        append("Please guess a whole number from 1 to 20.", "system");
        return;
      }

      const nextTries = gameState.tries + 1;
      if (guess === gameState.target) {
        append(`Correct! The number was ${guess}. Well done!`, "system");
        setGameState({ ...gameState, active: false, tries: nextTries });
      } else if (nextTries >= gameState.maxTries) {
        append(`Out of tries. The number was ${gameState.target}. Type 'play' to try again.`, "system");
        setGameState({ ...gameState, active: false, tries: nextTries });
      } else {
        const hint = guess < gameState.target ? "higher" : "lower";
        append(`Nope. Try ${hint}.`, "system");
        setGameState({ ...gameState, tries: nextTries });
      }
    } else if (command === "reset") {
      resetSession();
      append("Session reset. Type 'help' to see commands.", "system");
    } else {
      append(`Unknown command: ${command}. Type 'help' for a list of commands.`, "system");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCommand(input);
    setInput("");
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.titleBar}>
        <div style={styles.dots}>
          <span style={{ ...styles.dot, background: "#ff5f57" }} />
          <span style={{ ...styles.dot, background: "#ffbd2e" }} />
          <span style={{ ...styles.dot, background: "#28c840" }} />
        </div>
        <span style={styles.title}>CheerpJ Game Console</span>
        <span style={styles.status}>{status}</span>
      </div>
      <div style={styles.consoleBody} ref={consoleRef}>
        {history.map((item) => (
          <div key={item.id} style={item.type === "input" ? styles.inputLine : styles.line}>
            <span style={styles.prefix}>{item.type === "input" ? "$" : "»"}</span>
            <span style={styles.lineText}>{item.text}</span>
          </div>
        ))}
      </div>
      <form style={styles.inputRow} onSubmit={handleSubmit}>
        <input
          style={styles.input}
          placeholder="Type a command — help, play, guess 12, reset"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={false}
        />
        <button style={styles.submitBtn} type="submit">Enter</button>
      </form>
    </div>
  );
}

const styles = {
  wrapper: {
    flexShrink: 0,
    height: 280,
    display: "flex",
    flexDirection: "column",
    background: "rgba(4, 11, 22, 0.95)",
    borderTop: "1px solid rgba(0,212,255,0.18)",
    borderBottom: "1px solid rgba(0,212,255,0.18)",
    overflow: "hidden",
    boxShadow: "inset 0 0 30px rgba(0,255,136,0.08)",
  },
  titleBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderBottom: "1px solid rgba(0,212,255,0.12)",
    background: "rgba(0,0,0,0.25)",
    flexShrink: 0,
  },
  dots: { display: "flex", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: "50%" },
  title: {
    flex: 1,
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    letterSpacing: "0.08em",
    color: "#00ff88",
  },
  status: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "#9edb72",
    border: "1px solid rgba(158,219,114,0.2)",
    borderRadius: 999,
    padding: "4px 10px",
    whiteSpace: "nowrap",
  },
  consoleBody: {
    flex: 1,
    padding: "14px",
    overflowY: "auto",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "#d8f0ff",
    letterSpacing: "0.03em",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  line: { display: "flex", gap: 8, alignItems: "flex-start" },
  inputLine: { display: "flex", gap: 8, alignItems: "flex-start", color: "#9dd6ff" },
  prefix: { color: "#7dd7ff", minWidth: 18, fontFamily: "var(--font-mono)", fontSize: 12 },
  lineText: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
  inputRow: {
    display: "flex",
    gap: 8,
    padding: "12px 14px",
    borderTop: "1px solid rgba(0,212,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(0,212,255,0.14)",
    borderRadius: 10,
    color: "#e2f7ff",
    padding: "10px 12px",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    outline: "none",
  },
  submitBtn: {
    background: "linear-gradient(135deg, #00d4ff, #4f46e5)",
    border: "none",
    borderRadius: 10,
    color: "#000",
    padding: "10px 14px",
    fontFamily: "var(--font-ui)",
    fontSize: 12,
    cursor: "pointer",
  },
};
