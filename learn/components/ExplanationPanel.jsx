import React from "react";

const ICONS = ["◈", "◉", "◎", "◆", "◇", "◐", "◑"];

export default function ExplanationPanel({ bullets, loading }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.headerIcon}>✦</span>
        <span style={styles.headerLabel}>Explanation</span>
        {loading && <span style={styles.loadingTag}>Thinking…</span>}
      </div>

      <div style={styles.body}>
        {loading && bullets.length === 0 ? (
          <div style={styles.skeleton}>
            {[75, 90, 60, 80].map((w, i) => (
              <div key={i} style={styles.skeletonRow}>
                <div style={styles.skeletonDot} />
                <div style={{ ...styles.skeletonLine, width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
              </div>
            ))}
          </div>
        ) : bullets.length > 0 ? (
          <ul style={styles.list}>
            {bullets.map((b, i) => (
              <li
                key={i}
                style={{ ...styles.item, animationDelay: `${i * 0.07}s` }}
              >
                <span style={styles.bullet}>{ICONS[i % ICONS.length]}</span>
                <span style={styles.text}>{b}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>✦</span>
            <p style={styles.emptyText}>Explanations will appear here after generation</p>
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
    background: "rgba(13,20,40,0.6)",
    backdropFilter: "blur(12px)",
    overflow: "hidden",
    borderTop: "1px solid var(--border)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 16px",
    borderBottom: "1px solid var(--border)",
    background: "rgba(0,0,0,0.15)",
    flexShrink: 0,
  },
  headerIcon: {
    color: "var(--purple)",
    textShadow: "0 0 10px var(--purple-glow)",
    fontSize: 14,
  },
  headerLabel: {
    fontFamily: "var(--font-ui)",
    fontSize: 12,
    fontWeight: 700,
    color: "var(--text-muted)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    flex: 1,
  },
  loadingTag: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--cyan)",
    background: "var(--cyan-dim)",
    borderRadius: 10,
    padding: "2px 8px",
    animation: "status-pulse 1.2s ease-in-out infinite",
  },
  body: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 14px",
  },
  list: {
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  item: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    animation: "slide-up 0.35s ease both",
  },
  bullet: {
    color: "var(--cyan)",
    textShadow: "0 0 8px var(--cyan-glow)",
    fontSize: 12,
    flexShrink: 0,
    marginTop: 2,
  },
  text: {
    fontFamily: "var(--font-ui)",
    fontSize: 13,
    lineHeight: 1.65,
    color: "var(--text)",
  },
  skeleton: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  skeletonRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  skeletonDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    flexShrink: 0,
  },
  skeletonLine: {
    height: 11,
    borderRadius: 4,
    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)",
    backgroundSize: "400px 100%",
    animation: "shimmer 1.4s infinite",
    flex: 1,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: 8,
    opacity: 0.35,
    padding: 24,
  },
  emptyIcon: {
    fontSize: 22,
    color: "var(--purple)",
    textShadow: "0 0 16px var(--purple-glow)",
  },
  emptyText: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--text-muted)",
    textAlign: "center",
    lineHeight: 1.6,
  },
};
