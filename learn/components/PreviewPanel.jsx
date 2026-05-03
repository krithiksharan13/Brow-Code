import React, { useState } from "react";

export default function PreviewPanel({ url }) {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={styles.wrapper}>
      {/* Portal URL bar */}
      <div style={styles.urlBar}>
        <span style={styles.liveTag}>
          <span style={styles.liveDot} />
          LIVE
        </span>
        <span style={styles.urlText} title={url}>{url}</span>
        <button style={styles.copyBtn} onClick={copyUrl}>
          {copied ? "✓" : "⎘"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.openBtn}
        >
          ↗ Open
        </a>
      </div>

      {/* Live iframe preview */}
      <div style={styles.iframeWrapper}>
        <div style={styles.browserChrome}>
          <div style={styles.addressBar}>
            <span style={styles.addressText}>{url}</span>
          </div>
        </div>
        <iframe
          src={url}
          style={styles.iframe}
          title="Live server preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    flexShrink: 0,
    height: "45%",
    display: "flex",
    flexDirection: "column",
    background: "rgba(13,20,40,0.8)",
    borderTop: "1px solid rgba(0,212,255,0.3)",
    animation: "slide-up 0.4s ease",
    boxShadow: "0 -4px 24px rgba(0,212,255,0.08)",
  },
  urlBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    background: "rgba(0,0,0,0.3)",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },
  liveTag: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    fontWeight: 700,
    color: "#00ff88",
    background: "rgba(0,255,136,0.1)",
    border: "1px solid rgba(0,255,136,0.3)",
    borderRadius: 10,
    padding: "2px 8px",
    letterSpacing: "0.1em",
    flexShrink: 0,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "#00ff88",
    boxShadow: "0 0 6px #00ff88",
    animation: "status-pulse 2s ease-in-out infinite",
  },
  urlText: {
    flex: 1,
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--cyan)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textShadow: "0 0 8px var(--cyan-dim)",
  },
  copyBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    fontSize: 14,
    color: "var(--text-muted)",
    flexShrink: 0,
    transition: "color 0.2s",
    padding: "0 4px",
  },
  openBtn: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--cyan)",
    background: "var(--cyan-dim)",
    border: "1px solid rgba(0,212,255,0.25)",
    borderRadius: 6,
    padding: "3px 10px",
    textDecoration: "none",
    flexShrink: 0,
    transition: "background 0.2s",
    letterSpacing: "0.04em",
  },
  iframeWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  browserChrome: {
    background: "rgba(255,255,255,0.03)",
    borderBottom: "1px solid var(--border)",
    padding: "5px 10px",
    flexShrink: 0,
  },
  addressBar: {
    background: "rgba(0,0,0,0.3)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: "3px 10px",
  },
  addressText: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-muted)",
    letterSpacing: "0.03em",
  },
  iframe: {
    flex: 1,
    width: "100%",
    border: "none",
    background: "#fff",
  },
};
