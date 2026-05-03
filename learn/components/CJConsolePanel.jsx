import React, { useEffect } from "react";

let cjStylesInjected = false;
function injectCJStyles() {
  if (cjStylesInjected) return;
  cjStylesInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes cj-panel-enter {
      from { opacity: 0; transform: translateY(18px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes cj-quote-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(0, 212, 255, 0.14); }
      50% { box-shadow: 0 0 24px 8px rgba(0, 212, 255, 0.08); }
    }
    @keyframes cj-bubble-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }
  `;
  document.head.appendChild(style);
}

const PREFERRED_VOICE_KEYWORDS = [
  "google", "michael", "daniel", "alex", "james", "alloy", "deep", "male",
];

function chooseCJVoice(voices) {
  if (!voices || voices.length === 0) return null;

  const englishVoices = voices.filter((voice) => voice.lang && voice.lang.toLowerCase().startsWith("en"));
  const ordered = [...englishVoices, ...voices];

  for (const keyword of PREFERRED_VOICE_KEYWORDS) {
    const match = ordered.find((voice) => voice.name.toLowerCase().includes(keyword));
    if (match) return match;
  }

  return ordered[0] || null;
}

function speakCJQuote(text) {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.volume = 1;
  utterance.rate = 0.92;
  utterance.pitch = 0.92;

  const voices = window.speechSynthesis.getVoices();
  const bestVoice = chooseCJVoice(voices);
  if (bestVoice) utterance.voice = bestVoice;

  window.speechSynthesis.speak(utterance);
}

export default function CJConsolePanel({ quote }) {
  useEffect(() => { injectCJStyles(); }, []);

  useEffect(() => {
    const speak = () => speakCJQuote(quote);
    if (window && window.speechSynthesis && window.speechSynthesis.getVoices().length > 0) {
      speak();
    } else if (window && window.speechSynthesis) {
      const handleVoicesChanged = () => {
        if (window.speechSynthesis.getVoices().length > 0) {
          speak();
          window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
        }
      };
      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      };
    }
  }, [quote]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.bubble}>
          <span style={styles.bubbleText}>CJ</span>
        </div>
        <div style={styles.titleBlock}>
          <span style={styles.title}>CJ Game Console</span>
          <span style={styles.subtitle}>GTA: San Andreas</span>
        </div>
      </div>

      <div style={styles.consoleBody}>
        <div style={styles.quoteRow}>
          <span style={styles.quoteIcon}>“</span>
          <p style={styles.quoteText}>{quote}</p>
        </div>

        <div style={styles.voiceBank}>
          <div style={styles.voiceHeader}>
            <span style={styles.voiceLabel}>CJ voice lines</span>
            <span style={styles.voiceNote}>More iconic phrases for the console.</span>
          </div>
          <ul style={styles.voiceList}>
            <li style={styles.voiceItem}>Oh shit, here we go again...</li>
            <li style={styles.voiceItem}>All you had to do was follow the damn train, CJ!</li>
            <li style={styles.voiceItem}>Damn, this mission went sideways.</li>
            <li style={styles.voiceItem}>Grove Street, home. Let's make this code run.</li>
          </ul>
        </div>

        <div style={styles.hintRow}>
          <span style={styles.hintLabel}>Tip</span>
          <p style={styles.hintText}>
            Run a prompt and CJ will speak the quote using the best available English TTS voice. Real GTA audio requires licensed game voice clips.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    flexShrink: 0,
    minHeight: 220,
    display: "flex",
    flexDirection: "column",
    background: "rgba(4, 11, 22, 0.98)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    borderBottom: "1px solid rgba(0,212,255,0.18)",
    boxShadow: "inset 0 0 30px rgba(0,255,136,0.08)",
    overflow: "hidden",
    animation: "cj-panel-enter 0.55s ease-out both",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    background: "rgba(0,0,0,0.16)",
    borderBottom: "1px solid rgba(0,212,255,0.12)",
  },
  bubble: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #0d3a6c, #1b8cff)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontFamily: "var(--font-mono)",
    fontSize: 14,
    boxShadow: "0 0 16px rgba(0, 212, 255, 0.24)",
    animation: "cj-bubble-bounce 2.6s ease-in-out infinite",
  },
  bubbleText: {
    fontWeight: 700,
    letterSpacing: "0.12em",
  },
  titleBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  title: {
    color: "#00ff88",
    fontFamily: "var(--font-ui)",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.08em",
  },
  subtitle: {
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    letterSpacing: "0.1em",
  },
  consoleBody: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  quoteRow: {
    padding: "16px",
    borderRadius: 18,
    background: "rgba(0, 0, 0, 0.32)",
    border: "1px solid rgba(0,212,255,0.18)",
    boxShadow: "inset 0 0 18px rgba(0,212,255,0.06)",
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    animation: "cj-quote-pulse 3.6s ease-in-out infinite",
  },
  quoteIcon: {
    color: "#7dd7ff",
    fontSize: 32,
    lineHeight: 1,
  },
  quoteText: {
    margin: 0,
    color: "#e2e8f0",
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    lineHeight: 1.7,
  },
  hintRow: {
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  hintLabel: {
    display: "inline-block",
    marginBottom: 8,
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "#00d4ff",
    letterSpacing: "0.12em",
  },
  hintText: {
    margin: 0,
    color: "#94a3b8",
    fontFamily: "var(--font-ui)",
    fontSize: 12,
    lineHeight: 1.6,
  },
  voiceBank: {
    padding: "16px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(0,212,255,0.12)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  voiceHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  voiceLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 700,
    color: "#00ff88",
    letterSpacing: "0.08em",
  },
  voiceNote: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "#94a3b8",
  },
  voiceList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: 8,
  },
  voiceItem: {
    display: "inline-flex",
    gap: 10,
    alignItems: "flex-start",
    color: "#e2f0ff",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    lineHeight: 1.5,
  },
  voiceItemBefore: {
    content: '"',
  },
};
