import { BrowserPod } from "@leaningtech/browserpod";

// ?raw tells vite to bundle each file's content as a plain string at build time.
// This completely bypasses any runtime fetch / SPA-fallback issues.
import serverJs  from "./project/server.js?raw";
import gameHtml  from "./project/game.html?raw";
import gameJs    from "./project/game.js?raw";
import pkgJson   from "./project/package.json?raw";

const statusEl  = document.getElementById("status");
const portalEl  = document.getElementById("portalLink");
const previewEl = document.getElementById("preview");
const consoleEl = document.getElementById("console");

function setStatus(msg, color = "#888") {
  statusEl.textContent = msg;
  statusEl.style.color  = color;
}

// Write a string directly to the pod filesystem — no network call needed.
async function writeFile(pod, remotePath, content) {
  const buf = new TextEncoder().encode(content).buffer;
  const f   = await pod.createFile(remotePath, "binary");
  await f.write(buf);
  await f.close();
}

async function main() {
  setStatus("Booting pod…", "#ffd60a");
  const pod = await BrowserPod.boot({ apiKey: import.meta.env.VITE_BP_APIKEY });
  const terminal = await pod.createDefaultTerminal(consoleEl);

  pod.onPortal(({ url }) => {
    setStatus("✅ Game ready — share the link below with Player 2!", "#00ff9d");
    previewEl.src = url;
    portalEl.href = url;
    portalEl.textContent = "Open full screen ↗";
    portalEl.style.display = "inline";

    const shareRow = document.getElementById("shareRow");
    const shareUrl = document.getElementById("shareUrl");
    const copyBtn  = document.getElementById("copyUrl");
    if (shareRow && shareUrl && copyBtn) {
      shareUrl.textContent  = url;
      copyBtn.dataset.url   = url;
      copyBtn.style.display = "block";
      shareRow.style.display = "flex";
      document.getElementById("bootDots").style.display = "none";
    }
  });

  // ── Filesystem setup ───────────────────────────────────────────────────────
  setStatus("Setting up filesystem…", "#888");
  await pod.createDirectory("/game", { recursive: true });
  await pod.createDirectory("/game/.npm", { recursive: true });

  // ── Write bundled file contents straight to the pod ────────────────────────
  // Content comes from vite's ?raw import — it is already a JS string here,
  // so there is nothing to fetch and no chance of getting an HTML fallback.
  setStatus("Writing game files…", "#888");
  await writeFile(pod, "/game/package.json", pkgJson);
  await writeFile(pod, "/game/server.js",    serverJs);
  await writeFile(pod, "/game/game.html",    gameHtml);
  await writeFile(pod, "/game/game.js",      gameJs);

  // ── npm install (only needs `ws`) ──────────────────────────────────────────
  setStatus("Installing npm dependencies…", "#ffd60a");
  await pod.run(
    "npm",
    ["install", "--no-audit", "--no-fund", "--omit=optional", "--cache", "/game/.npm"],
    { echo: true, terminal, cwd: "/game", env: ["npm_config_cache=/game/.npm"] }
  );

  // ── Start server ───────────────────────────────────────────────────────────
  // server.js only uses built-in Node modules (http, ws, vm, fs, path)
  // plus the `ws` package installed above — no compiler needed.
  setStatus("Starting game server…", "#00e5ff");
  await pod.run("node", ["server.js"], { echo: true, terminal, cwd: "/game" });
}

main().catch((err) => {
  setStatus("❌ " + err.message, "#ff2d55");
  console.error(err);
});
