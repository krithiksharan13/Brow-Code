import React, { useEffect, useRef, useState } from "react";
import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";  // ← C++ instead of JavaScript

hljs.registerLanguage("cpp", cpp);

// Inject a minimal dark Dracula-style theme once
let themeInjected = false;
function injectTheme() {
  if (themeInjected) return;
  themeInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .hljs                { background: transparent; color: #c9d1d9; }
    .hljs-keyword        { color: #ff79c6; }
    .hljs-string         { color: #f1fa8c; }
    .hljs-comment        { color: #6272a4; font-style: italic; }
    .hljs-number         { color: #bd93f9; }
    .hljs-function       { color: #50fa7b; }
    .hljs-title          { color: #50fa7b; }
    .hljs-title.function_{ color: #50fa7b; }
    .hljs-built_in       { color: #8be9fd; }
    .hljs-type           { color: #8be9fd; }
    .hljs-variable       { color: #f8f8f2; }
    .hljs-attr           { color: #50fa7b; }
    .hljs-literal        { color: #bd93f9; }
    .hljs-property       { color: #66d9e8; }
    .hljs-params         { color: #ffb86c; }
    .hljs-operator       { color: #ff79c6; }
    .hljs-meta           { color: #ff79c6; }
    .hljs-meta .hljs-string { color: #f1fa8c; }
    .code-line {
      display: flex;
      gap: 6px;
      padding: 0 6px;
      white-space: pre;
    }
    .code-line.changed {
      background: rgba(16, 185, 129, 0.12);
    }
    .line-number {
      width: 36px;
      user-select: none;
      opacity: 0.4;
      text-align: right;
      font-family: var(--font-mono);
      font-size: 11px;
      line-height: 1.45;
      color: #94a3b8;
    }
    .line-code {
      flex: 1;
      display: inline-block;
      line-height: 1.45;
    }
  `;
  document.head.appendChild(style);
}

export default function CodePanel({ code, loading, highlightedLines = [], editable = false, onCodeChange }) {
  const preRef              = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { injectTheme(); }, []);

  useEffect(() => {
    if (preRef.current && code) {
      const html = code
        .split("\n")
        .map((line, index) => {
          const lineHtml = hljs.highlight(line || " ", { language: "cpp" }).value;
          const isChanged = highlightedLines.includes(index);
          return `
            <div class="code-line${isChanged ? " changed" : ""}">
              <span class="line-number">${index + 1}</span>
              <span class="line-code">${lineHtml}</span>
            </div>`;
        })
        .join("");
      preRef.current.innerHTML = html;
    }
  }, [code, highlightedLines]);

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={styles.wrapper}>
      {/* Header bar */}
      <div style={styles.bar}>
        <div style={styles.dots}>
          <span style={{ ...styles.dot, background: "#ff5f57" }} />
          <span style={{ ...styles.dot, background: "#ffbd2e" }} />
          <span style={{ ...styles.dot, background: "#28c840" }} />
        </div>
        <span style={styles.barLabel}>main.cpp</span>
        <span style={styles.langTag}>C++17</span>
        <button
          style={{ ...styles.copyBtn, color: copied ? "#00ff88" : "var(--text-muted)" }}
          onClick={copyCode}
          title="Copy code"
        >
          {copied ? "✓ Copied" : "⎘ Copy"}
        </button>
      </div>

      {/* Code area */}
      <div style={styles.codeArea}>
        {loading && !code ? (
          <div style={styles.skeleton}>
            {[80, 60, 90, 50, 70, 40, 85, 55].map((w, i) => (
              <div
                key={i}
                style={{
                  ...styles.skeletonLine,
                  width: `${w}%`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        ) : code ? (
          editable ? (
            <textarea
              style={styles.editArea}
              value={code}
              onChange={(e) => onCodeChange?.(e.target.value)}
              spellCheck="false"
            />
          ) : (
            <div ref={preRef} style={styles.pre} className="hljs" />
          )
        ) : editable ? (
          <textarea
            style={styles.editArea}
            value={code}
            onChange={(e) => onCodeChange?.(e.target.value)}
            placeholder="Write or paste your C++ code here"
            spellCheck="false"
          />
        ) : (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>{"#include"}</div>
            <p style={styles.emptyText}>Your generated C++ code will appear here</p>
            <p style={styles.emptyHint}>
              Try: "Print the sum of 42 and 58"
              {"\n"}or "Sort the words apple, mango, banana"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    flex: "0 0 auto",
    maxHeight: "55%",
    display: "flex",
    flexDirection: "column",
    borderBottom: "1px solid var(--border)",
    background: "var(--panel-bg)",
    backdropFilter: "blur(16px)",
    overflow: "hidden",
    animation: "fade-in 0.4s ease",
  },
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    borderBottom: "1px solid var(--border)",
    background: "rgba(0,0,0,0.2)",
    flexShrink: 0,
  },
  dots:     { display: "flex", gap: 5 },
  dot:      { width: 10, height: 10, borderRadius: "50%" },
  barLabel: {
    flex: 1,
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--text-muted)",
    letterSpacing: "0.06em",
    marginLeft: 4,
  },
  langTag: {
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    fontWeight: 700,
    color: "var(--cyan)",
    background: "var(--cyan-dim)",
    border: "1px solid rgba(0,212,255,0.2)",
    borderRadius: 8,
    padding: "2px 7px",
    letterSpacing: "0.08em",
  },
  copyBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    transition: "color 0.2s",
    letterSpacing: "0.04em",
  },
  codeArea: {
    flex: 1,
    overflowY: "auto",
    overflowX: "auto",
    padding: "14px 18px",
  },
  editArea: {
    width: "100%",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    color: "var(--text)",
    fontFamily: "var(--font-mono)",
    fontSize: 12.5,
    lineHeight: 1.5,
    padding: "12px 14px",
    outline: "none",
    resize: "none",
    whiteSpace: "pre",
    minHeight: 300,
  },
  pre: {
    fontFamily: "var(--font-mono)",
    fontSize: 12.5,
    lineHeight: 1.7,
    margin: 0,
    whiteSpace: "pre",
    tabSize: 2,
  },
  skeleton: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    padding: "4px 0",
  },
  skeletonLine: {
    height: 12,
    borderRadius: 4,
    background:
      "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
    backgroundSize: "400px 100%",
    animation: "shimmer 1.4s infinite",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: 10,
    opacity: 0.4,
    padding: "32px 24px",
  },
  emptyIcon: {
    fontFamily: "var(--font-mono)",
    fontSize: 22,
    color: "var(--cyan)",
    textShadow: "0 0 20px var(--cyan-glow)",
  },
  emptyText: {
    fontFamily: "var(--font-ui)",
    fontSize: 13,
    color: "var(--text-muted)",
    fontWeight: 600,
  },
  emptyHint: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--text-muted)",
    textAlign: "center",
    lineHeight: 1.7,
    whiteSpace: "pre-line",
  },
};
