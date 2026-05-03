import React from "react";

export default function ProductPreviewPanel({ portalUrl, runCount, bpStatus }) {
  const buildReady = runCount > 0;
  const statusLabel = bpStatus === "booting"
    ? "Booting sandbox…"
    : bpStatus === "installing"
    ? "Installing runtime…"
    : bpStatus === "ready"
    ? "Sandbox ready"
    : bpStatus === "error"
    ? "Sandbox error"
    : "Sandbox offline";

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.dots}>
          <span style={{ ...styles.dot, background: "#ff5f57" }} />
          <span style={{ ...styles.dot, background: "#ffbd2e" }} />
          <span style={{ ...styles.dot, background: "#28c840" }} />
        </div>
        <div style={styles.titleBlock}>
          <span style={styles.title}>Product Preview</span>
          <span style={styles.subtitle}>Build output appears after terminal execution</span>
        </div>
      </div>

      <div style={styles.body}>
        {portalUrl ? (
          <>
            <div style={styles.badge}>Live product available</div>
            <div style={styles.previewCard}>
              <div style={styles.previewImage} aria-hidden="true">
                <span style={styles.previewTag}>Live</span>
              </div>
              <div style={styles.previewContent}>
                <h3 style={styles.previewTitle}>Built product ready to inspect</h3>
                <p style={styles.previewText}>
                  A live preview is available from the terminal build output. Open it to view your generated product.
                </p>
                <a href={portalUrl} target="_blank" rel="noreferrer" style={styles.openLink}>
                  Open preview
                </a>
              </div>
            </div>
          </>
        ) : buildReady ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🛠</div>
            <h3 style={styles.emptyTitle}>Running in terminal</h3>
            <p style={styles.emptyText}>
              Your C++ program executed successfully, but it did not launch a browser portal.
              This means the Snake game is running in the terminal panel above rather than in the preview pane.
            </p>
            <p style={styles.tipText}>
              Tip: if you want a browser-based preview, ask for a web/HTML Snake game instead of a terminal-style C++ program.
            </p>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>⌛</div>
            <h3 style={styles.emptyTitle}>No preview yet</h3>
            <p style={styles.emptyText}>
              Run the code in the terminal and build the product. The preview panel will show the result here.
            </p>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <div style={styles.footerItem}>Builds run: {runCount}</div>
        <div style={styles.footerItem}>{statusLabel}</div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    flexShrink: 0,
    minHeight: 280,
    display: "flex",
    flexDirection: "column",
    background: "rgba(13, 20, 40, 0.9)",
    borderTop: "1px solid rgba(0, 212, 255, 0.2)",
    borderBottom: "1px solid rgba(0, 212, 255, 0.2)",
    overflow: "hidden",
    boxShadow: "0 0 40px rgba(0, 0, 0, 0.25)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0, 0, 0, 0.18)",
  },
  dots: { display: "flex", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: "50%" },
  titleBlock: { display: "flex", flexDirection: "column", gap: 2 },
  title: {
    fontFamily: "var(--font-ui)",
    fontSize: 13,
    color: "#00ff88",
    fontWeight: 700,
  },
  subtitle: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "#94a3b8",
    letterSpacing: "0.08em",
  },
  body: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px",
  },
  badge: {
    alignSelf: "flex-start",
    marginBottom: 12,
    padding: "4px 10px",
    borderRadius: 999,
    background: "rgba(0,255,136,0.12)",
    color: "#00ff88",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    letterSpacing: "0.08em",
    fontWeight: 700,
  },
  previewCard: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: 16,
    width: "100%",
    maxWidth: 520,
    padding: 18,
    borderRadius: 22,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  previewImage: {
    position: "relative",
    borderRadius: 18,
    background: "linear-gradient(180deg, #0f172a, #020617)",
    minHeight: 120,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  previewTag: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(0,255,136,0.14)",
    color: "#00ff88",
    fontSize: 10,
    fontWeight: 700,
  },
  previewContent: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  previewTitle: {
    margin: 0,
    fontFamily: "var(--font-ui)",
    fontSize: 16,
    color: "#e2e8f0",
  },
  previewText: {
    margin: 0,
    color: "#94a3b8",
    fontFamily: "var(--font-ui)",
    fontSize: 12,
    lineHeight: 1.7,
  },
  openLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: 12,
    background: "linear-gradient(135deg, #00d4ff, #4f46e5)",
    color: "#000",
    fontFamily: "var(--font-ui)",
    fontSize: 12,
    fontWeight: 700,
    textDecoration: "none",
  },
  emptyState: {
    textAlign: "center",
    color: "#94a3b8",
    maxWidth: 420,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 14,
  },
  emptyTitle: {
    margin: 0,
    fontFamily: "var(--font-ui)",
    fontSize: 16,
    color: "#e2e8f0",
  },
  emptyText: {
    margin: "10px auto 0",
    fontFamily: "var(--font-ui)",
    fontSize: 12,
    lineHeight: 1.7,
    color: "#94a3b8",
  },
  tipText: {
    margin: "12px auto 0",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    lineHeight: 1.6,
    color: "#a5b4fc",
  },
  footer: {
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.14)",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "#94a3b8",
  },
  footerItem: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.04)",
  },
};
