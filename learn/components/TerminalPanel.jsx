import React from "react";

export default function TerminalPanel({ terminalRef, podStatus, runCount }) {
  const isReady      = podStatus === "ready";
  const isBooting    = podStatus === "booting";
  const isInstalling = podStatus === "installing";

  return (
    <div style={styles.wrapper}>
      {/* Terminal title bar */}
      <div style={styles.titleBar}>
        <div style={styles.dots}>
          <span style={{ ...styles.dot, background: "#ff5f57" }} />
          <span style={{ ...styles.dot, background: "#ffbd2e" }} />
          <span style={{ ...styles.dot, background: "#28c840" }} />
        </div>
        <span style={styles.title}>
          <span style={styles.promptChar}>~</span> BrowserPod Terminal
        </span>
        {runCount > 0 && (
          <span style={styles.runBadge}>▶ Run #{runCount}</span>
        )}
        <div style={{ flex: 1 }} />
        <span style={styles.statusChip}>
          {isReady ? (
            <>
              <span style={{ ...styles.pipeDot, background: "#00ff88", boxShadow: "0 0 6px #00ff88" }} />
              Live
            </>
          ) : isBooting ? (
            <>
              <span style={{ ...styles.pipeDot, background: "#f59e0b", animation: "status-pulse 1s infinite" }} />
              Booting
            </>
          ) : (
            <>
              <span style={{ ...styles.pipeDot, background: "#64748b" }} />
              Disconnected
            </>
          )}
        </span>
      </div>

      {/* The BrowserPod terminal gets mounted here */}
      <div style={styles.terminalBody}>
        {/* BrowserPod injects its XTerm.js terminal into this element */}
        <div
          ref={terminalRef}
          style={styles.terminalMount}
          id="bp-terminal"
        />

        {/* Overlay shown before pod is ready — hidden once ready so terminal shows through */}
        {!isReady && (
          <div style={styles.overlay}>
            {(isBooting || isInstalling) ? (
              <div style={styles.bootingMsg}>
                <div style={styles.spinner} />
                <span style={{ color: "#4ade80" }}>
                  {isInstalling
                    ? "npm install JSCPP  —  installing C++ runtime…"
                    : "Booting WebAssembly sandbox…"}
                </span>
                {isInstalling && (
                  <span style={styles.installHint}>
                    This runs once. Future boots are instant.
                  </span>
                )}
              </div>
            ) : (
              <div style={styles.waitMsg}>
                <span style={styles.waitIcon}>{">"}_</span>
                <span>Enter your BrowserPod API key above to start the sandbox</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#090c14",
    borderBottom: "1px solid var(--border)",
    overflow: "hidden",
    boxShadow: "inset 0 0 40px rgba(0,0,0,0.4)",
  },
  titleBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    background: "rgba(0,0,0,0.4)",
    borderBottom: "1px solid rgba(0,255,136,0.12)",
    flexShrink: 0,
  },
  dots: {
    display: "flex",
    gap: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
  },
  title: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "#4ade80",
    marginLeft: 4,
    letterSpacing: "0.04em",
  },
  promptChar: {
    color: "var(--cyan)",
    marginRight: 4,
    textShadow: "0 0 8px var(--cyan-glow)",
  },
  runBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "#00ff88",
    background: "rgba(0,255,136,0.1)",
    border: "1px solid rgba(0,255,136,0.2)",
    borderRadius: 10,
    padding: "2px 8px",
    animation: "fade-in 0.3s ease",
  },
  statusChip: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-muted)",
    letterSpacing: "0.06em",
  },
  pipeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },
  terminalBody: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  terminalMount: {
    position: "absolute",
    inset: 0,
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    color: "var(--text)",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(9,12,20,0.92)",
    zIndex: 2,
    ariaBusy: true,
  },
  bootingMsg: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
    color: "#4ade80",
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    ariaLive: "polite",
  },
  installHint: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-muted)",
    letterSpacing: "0.04em",
  },
  spinner: {
    width: 32,
    height: 32,
    border: "2px solid rgba(0,255,136,0.2)",
    borderTop: "2px solid #00ff88",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  waitMsg: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    opacity: 0.45,
    textAlign: "center",
    padding: "0 40px",
    // Add ARIA attributes for better accessibility
    role: "status",
    "aria-live": "polite",
  },
  waitIcon: {
    fontFamily: "var(--font-mono)",
    fontSize: 24,
    color: "#4ade80",
    animation: "blink 1.2s step-end infinite",
  },
};

// Inject spinner keyframe
if (typeof document !== "undefined" && !document.getElementById("bp-spin-style")) {
  const s = document.createElement("style");
  s.id = "bp-spin-style";
  s.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(s);
}