(() => {
  const D = window.HELIX;
  const HOME = `/home/${D.user}`;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const APPS = [
    { id: "welcome", name: "Welcome", dock: false, desktop: false, singleton: true },
    { id: "terminal", name: "Terminal", dock: true, desktop: true, singleton: false, glyph: ">_" },
    { id: "files", name: "Files", dock: true, desktop: true, singleton: true, glyph: "▣" },
    { id: "about", name: "About", dock: true, desktop: true, singleton: true, glyph: "◉" },
    { id: "projects", name: "Projects", dock: true, desktop: true, singleton: true, glyph: "⌘" },
    { id: "skills", name: "Skills", dock: true, desktop: false, singleton: true, glyph: "◈" },
    { id: "contact", name: "Mail", dock: true, desktop: true, singleton: true, glyph: "✉" },
    { id: "settings", name: "Settings", dock: true, desktop: false, singleton: true, glyph: "⚙" },
    { id: "htop", name: "Monitor", dock: false, desktop: false, singleton: true, glyph: "▦" },
    { id: "viewer", name: "Reader", dock: false, desktop: false, singleton: false, glyph: "≡" },
  ];

  const appById = (id) => APPS.find((a) => a.id === id);

  const files = {
    "README.md": `Helix OS
========
hostname : ${D.host}
user     : ${D.user}
de       : ${D.de}

This machine is a portfolio. Try:

  neofetch
  ls Projects
  cat about.txt
  open projects
  help
`,
    "about.txt": `${D.user}
${D.location}
${D.title}

${D.bio.join("\n\n")}

GitHub: ${D.github}
`,
    "contact.txt": `github : ${D.github}
host   : ${D.user}@${D.host}
mail   : open the Mail app, or type  open contact
`,
    Documents: {
      "resume.md": `# ${D.user}

${D.title}
${D.location}

## Selected work
${D.projects.map((p) => `- ${p.name} — ${p.blurb}`).join("\n")}

## Stack
${D.skills.map((g) => `${g.group}: ${g.items.join(", ")}`).join("\n")}
`,
      "notes.txt": "TODO: rice the bar a little more. always.\n",
    },
    Projects: Object.fromEntries(
      D.projects.map((p) => [
        `${p.id}.md`,
        `# ${p.name}\n${p.year} · ${p.tag}\n\n${p.blurb}\n\nstack: ${p.stack.join(", ")}\n${p.href ? "live: " + p.href + "\n" : ""}${p.repo ? "repo: " + p.repo + "\n" : ""}`,
      ])
    ),
    Pictures: {
      "wallpaper.jpg": "[binary: night garden, helix default rice]\n",
    },
    ".config": {
      "hyprfolio.conf": "general {\n  gaps_in = 8\n  gaps_out = 14\n  border_size = 1\n  col.active_border = brass\n}\n",
    },
  };

  const state = {
    screen: "boot",
    workspace: 1,
    z: 20,
    windows: [],
    winSeq: 1,
    history: [],
    skipBoot: new URLSearchParams(location.search).has("skip") || localStorage.getItem("helix-skip-boot") === "1",
    jumpDesktop: new URLSearchParams(location.search).has("desktop"),
    theme: localStorage.getItem("helix-theme") || "helix",
    startedAt: Date.now(),
    drag: null,
    resize: null,
  };

  document.documentElement.dataset.theme = state.theme === "helix" ? "" : state.theme;
  if (state.theme === "helix") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = state.theme;

  /* ---------------- boot ---------------- */
  function boot() {
    const log = $("#boot-log");
    const lines = [
      { t: `[    0.000000] Linux version ${D.kernel} (root@${D.host}) (gcc 14.2.1, GNU ld 2.43)`, d: 30 },
      { t: `[    0.000000] Command line: BOOT_IMAGE=/vmlinuz root=UUID=a1g0-r4th3m rw quiet splash`, d: 20 },
      { t: `[    0.142881] x86/fpu: x87 + sse + avx2`, d: 20 },
      { t: `[    0.418002] Booting Helix on bare metal`, d: 30 },
      { t: `[    0.902114] PCI: Using ACPI for IRQ routing`, d: 20 },
      { t: `[    1.204551] helix-fs: mounted ${HOME}`, d: 40 },
      { t: `[    1.551003] usb 1-1: new high-speed USB device — “curiosity”`, d: 30 },
      { t: `         Starting <span class="dim">Load Kernel Modules...</span>`, d: 40 },
      { t: `<span class="ok">[  OK  ]</span> Found device /dev/portfolio`, d: 50 },
      { t: `<span class="ok">[  OK  ]</span> Started InspectLab.service`, d: 45 },
      { t: `<span class="ok">[  OK  ]</span> Started stickerEDU.service`, d: 45 },
      { t: `<span class="ok">[  OK  ]</span> Started ShopPilot.service`, d: 45 },
      { t: `<span class="ok">[  OK  ]</span> Started CareTrail.service`, d: 40 },
      { t: `<span class="ok">[  OK  ]</span> Started three-body.service`, d: 40 },
      { t: `<span class="ok">[  OK  ]</span> Reached target Graphical Interface.`, d: 70 },
      { t: `\n${D.distro} ${D.kernel} (${D.host})\n`, d: 80 },
      { t: `<span class="dim">starting ${D.de} …</span>`, d: 90 },
    ];

    const skip = () => {
      if (state.screen !== "boot") return;
      showLock();
    };
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") skip();
    });
    $("#boot").addEventListener("click", skip);

    if (state.jumpDesktop) {
      $("#boot").classList.add("hidden");
      enterDesktop();
      return;
    }
    if (state.skipBoot) {
      showLock();
      return;
    }

    let i = 0;
    const tick = () => {
      if (state.screen !== "boot") return;
      if (i >= lines.length) {
        setTimeout(showLock, 280);
        return;
      }
      const line = lines[i++];
      log.innerHTML += line.t + "\n";
      log.scrollTop = log.scrollHeight;
      setTimeout(tick, line.d);
    };
    tick();
  }

  function showLock() {
    state.screen = "lock";
    $("#boot").classList.add("hidden");
    $("#lock").classList.remove("hidden");
    $("#lock-user").textContent = D.user;
    const img = $("#lock-avatar");
    img.src = D.avatar;
    img.alt = D.user;
    img.onerror = () => {
      img.style.display = "none";
    };
    tickClocks();
    $("#unlock-pass").focus();
  }

  $("#unlock-form").addEventListener("submit", (e) => {
    e.preventDefault();
    enterDesktop();
  });

  function enterDesktop() {
    state.screen = "desktop";
    $("#boot").classList.add("hidden");
    $("#lock").classList.add("hidden");
    $("#desktop").classList.remove("hidden");
    renderWorkspaces();
    renderDock();
    renderDesktopIcons();
    renderLauncherGrid();
    tickClocks();
    notify("helix-notify", `Welcome back, ${D.user}. Ctrl+Space opens the launcher.`);
    if (window.innerWidth >= 760) openApp("welcome");
    setTimeout(() => openApp("terminal"), 160);
  }

  /* ---------------- clocks / tray ---------------- */
  function tickClocks() {
    const now = new Date();
    const hh = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const long = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    const lockClock = $("#lock-clock");
    const lockDate = $("#lock-date");
    if (lockClock) lockClock.textContent = hh;
    if (lockDate) lockDate.textContent = long;
    const btn = $("#clock-btn");
    if (btn) btn.textContent = `${now.toLocaleDateString([], { weekday: "short" })} ${hh}`;
  }
  setInterval(tickClocks, 1000);

  $("#clock-btn").addEventListener("click", () => {
    const pop = $("#calendar-pop");
    pop.classList.toggle("hidden");
    if (!pop.classList.contains("hidden")) {
      const now = new Date();
      pop.innerHTML = `<b>${now.toLocaleDateString([], { weekday: "long" })}</b><p>${now.toLocaleString()}</p><p class="dim" style="color:var(--muted)">timezone: Asia/Singapore-ish<br>uptime: ${uptime()}</p>`;
    }
  });

  function uptime() {
    const s = Math.floor((Date.now() - state.startedAt) / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h) return `${h}h ${m % 60}m`;
    if (m) return `${m}m ${s % 60}s`;
    return `${s}s`;
  }

  /* ---------------- workspaces / dock / icons ---------------- */
  function renderWorkspaces() {
    const root = $("#workspaces");
    root.innerHTML = "";
    for (let i = 1; i <= 4; i++) {
      const b = document.createElement("button");
      b.className = "ws" + (state.workspace === i ? " active" : "") + (state.windows.some((w) => w.workspace === i) ? " occupied" : "");
      b.textContent = i;
      b.addEventListener("click", () => setWorkspace(i));
      root.appendChild(b);
    }
  }

  function setWorkspace(n) {
    state.workspace = n;
    state.windows.forEach((w) => {
      w.el.classList.toggle("hidden", w.workspace !== n || w.minimized);
    });
    renderWorkspaces();
    updateBarTitle();
    updateDockOpen();
  }

  function renderDock() {
    const dock = $("#dock");
    dock.innerHTML = "";
    APPS.filter((a) => a.dock).forEach((a) => {
      const b = document.createElement("button");
      b.className = "dock-item";
      b.dataset.app = a.id;
      b.innerHTML = `<span class="tip">${esc(a.name)}</span><span>${a.glyph || "●"}</span>`;
      b.addEventListener("click", () => openApp(a.id));
      dock.appendChild(b);
    });
    updateDockOpen();
  }

  function updateDockOpen() {
    $$(".dock-item").forEach((el) => {
      el.classList.toggle("open", state.windows.some((w) => w.app === el.dataset.app && !w.minimized && w.workspace === state.workspace));
    });
  }

  function renderDesktopIcons() {
    const root = $("#desktop-icons");
    root.innerHTML = "";
    APPS.filter((a) => a.desktop).forEach((a) => {
      const b = document.createElement("button");
      b.className = "desk-icon";
      b.innerHTML = `<div class="glyph">${a.glyph || "●"}</div><span>${esc(a.name)}</span>`;
      b.addEventListener("click", () => openApp(a.id));
      b.addEventListener("dblclick", () => openApp(a.id));
      root.appendChild(b);
    });
  }

  function renderLauncherGrid(filter = "") {
    const grid = $("#launcher-grid");
    const q = filter.trim().toLowerCase();
    grid.innerHTML = "";
    APPS.filter((a) => a.id !== "viewer" && (!q || a.name.toLowerCase().includes(q) || a.id.includes(q))).forEach((a) => {
      const b = document.createElement("button");
      b.innerHTML = `<div style="font-size:20px;margin-bottom:6px">${a.glyph || "●"}</div>${esc(a.name)}`;
      b.addEventListener("click", () => {
        closeLauncher();
        openApp(a.id);
      });
      grid.appendChild(b);
    });
  }

  $("#launcher-btn").addEventListener("click", toggleLauncher);
  $("#launcher-search").addEventListener("input", (e) => renderLauncherGrid(e.target.value));
  $("#launcher").addEventListener("click", (e) => {
    if (e.target.id === "launcher") closeLauncher();
  });

  function toggleLauncher() {
    const el = $("#launcher");
    const hidden = el.classList.contains("hidden");
    el.classList.toggle("hidden", !hidden);
    if (hidden) {
      $("#launcher-search").value = "";
      renderLauncherGrid();
      $("#launcher-search").focus();
    }
  }
  function closeLauncher() {
    $("#launcher").classList.add("hidden");
  }

  /* ---------------- window manager ---------------- */
  function openApp(id, opts = {}) {
    const meta = appById(id);
    if (!meta) return;
    if (meta.singleton) {
      const existing = state.windows.find((w) => w.app === id);
      if (existing) {
        existing.workspace = state.workspace;
        existing.minimized = false;
        focusWin(existing);
        if (opts.payload && id === "viewer") renderViewer(existing, opts.payload);
        setWorkspace(state.workspace);
        return existing;
      }
    }
    const n = state.windows.length;
    const pos = defaultPos(id, n);
    const win = {
      id: state.winSeq++,
      app: id,
      title: opts.title || meta.name,
      x: opts.x ?? pos.x,
      y: opts.y ?? pos.y,
      w: opts.w || defaultSize(id).w,
      h: opts.h || defaultSize(id).h,
      workspace: state.workspace,
      minimized: false,
      maximized: false,
      z: ++state.z,
      payload: opts.payload || null,
      term: null,
    };
    win.el = mountWindow(win);
    state.windows.push(win);
    paintApp(win);
    focusWin(win);
    renderWorkspaces();
    updateDockOpen();
    return win;
  }

  function defaultPos(id, n) {
    if (id === "welcome") return { x: 148, y: 72 };
    if (id === "terminal") return { x: 560, y: 164 };
    return { x: 148 + (n % 5) * 36, y: 72 + (n % 5) * 28 };
  }

  function defaultSize(id) {
    const map = {
      terminal: { w: 700, h: 430 },
      files: { w: 740, h: 480 },
      about: { w: 560, h: 500 },
      projects: { w: 640, h: 560 },
      skills: { w: 520, h: 460 },
      contact: { w: 520, h: 500 },
      settings: { w: 420, h: 380 },
      htop: { w: 560, h: 380 },
      welcome: { w: 460, h: 360 },
      viewer: { w: 520, h: 420 },
    };
    return map[id] || { w: 520, h: 400 };
  }

  function mountWindow(win) {
    const el = document.createElement("div");
    el.className = "window";
    el.style.cssText = `left:${win.x}px;top:${win.y}px;width:${win.w}px;height:${win.h}px;z-index:${win.z}`;
    el.innerHTML = `
      <div class="titlebar">
        <h2></h2>
        <div class="win-controls">
          <button class="min" title="Minimize"></button>
          <button class="max" title="Maximize"></button>
          <button class="cls" title="Close"></button>
        </div>
      </div>
      <div class="win-body pad"></div>
      <div class="resize-h"></div>
    `;
    el.querySelector("h2").textContent = win.title;
    el.addEventListener("mousedown", () => focusWin(win));
    el.querySelector(".min").addEventListener("click", (e) => {
      e.stopPropagation();
      minimizeWin(win);
    });
    el.querySelector(".max").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMax(win);
    });
    el.querySelector(".cls").addEventListener("click", (e) => {
      e.stopPropagation();
      closeWin(win);
    });
    el.querySelector(".titlebar").addEventListener("dblclick", () => toggleMax(win));
    bindDrag(win, el.querySelector(".titlebar"));
    bindResize(win, el.querySelector(".resize-h"));
    $("#windows").appendChild(el);
    return el;
  }

  function bodyOf(win) {
    return win.el.querySelector(".win-body");
  }

  function focusWin(win) {
    win.z = ++state.z;
    win.el.style.zIndex = win.z;
    win.minimized = false;
    win.el.classList.remove("minimized");
    if (win.workspace !== state.workspace) {
      state.workspace = win.workspace;
      setWorkspace(state.workspace);
    }
    state.windows.forEach((w) => w.el.classList.toggle("focused", w === win));
    updateBarTitle();
    updateDockOpen();
    const input = win.el.querySelector(".term-in");
    if (input) setTimeout(() => input.focus(), 0);
  }

  function updateBarTitle() {
    const top = [...state.windows]
      .filter((w) => w.workspace === state.workspace && !w.minimized)
      .sort((a, b) => b.z - a.z)[0];
    $("#bar-title").textContent = top ? top.title : "Desktop";
  }

  function minimizeWin(win) {
    win.minimized = true;
    win.el.classList.add("minimized");
    updateBarTitle();
    updateDockOpen();
  }

  function toggleMax(win) {
    win.maximized = !win.maximized;
    win.el.classList.toggle("maximized", win.maximized);
  }

  function closeWin(win) {
    if (win.term && win.term.matrixTimer) clearInterval(win.term.matrixTimer);
    if (win.htopTimer) clearInterval(win.htopTimer);
    win.el.remove();
    state.windows = state.windows.filter((w) => w !== win);
    renderWorkspaces();
    updateBarTitle();
    updateDockOpen();
  }

  function bindDrag(win, bar) {
    bar.addEventListener("mousedown", (e) => {
      if (e.button !== 0 || win.maximized) return;
      if (e.target.closest(".win-controls")) return;
      state.drag = { win, dx: e.clientX - win.x, dy: e.clientY - win.y };
      e.preventDefault();
    });
  }

  function bindResize(win, handle) {
    handle.addEventListener("mousedown", (e) => {
      if (e.button !== 0 || win.maximized) return;
      state.resize = { win, sx: e.clientX, sy: e.clientY, sw: win.w, sh: win.h };
      e.preventDefault();
      e.stopPropagation();
    });
  }

  window.addEventListener("mousemove", (e) => {
    if (state.drag) {
      const { win, dx, dy } = state.drag;
      win.x = Math.max(0, e.clientX - dx);
      win.y = Math.max(8, e.clientY - dy);
      win.el.style.left = win.x + "px";
      win.el.style.top = win.y + "px";
    } else if (state.resize) {
      const { win, sx, sy, sw, sh } = state.resize;
      win.w = Math.max(280, sw + (e.clientX - sx));
      win.h = Math.max(180, sh + (e.clientY - sy));
      win.el.style.width = win.w + "px";
      win.el.style.height = win.h + "px";
    }
  });
  window.addEventListener("mouseup", () => {
    state.drag = null;
    state.resize = null;
  });

  /* ---------------- apps ---------------- */
  function paintApp(win) {
    const body = bodyOf(win);
    const painters = {
      welcome: paintWelcome,
      about: paintAbout,
      projects: paintProjects,
      skills: paintSkills,
      contact: paintContact,
      settings: paintSettings,
      files: paintFiles,
      htop: paintHtop,
      terminal: paintTerminal,
      viewer: paintViewer,
    };
    (painters[win.app] || paintAbout)(win, body);
  }

  function paintWelcome(win, body) {
    body.className = "win-body pad welcome";
    body.innerHTML = `
      <h2>Helix OS</h2>
      <p class="prose">Projects, notes, and a terminal. Click the dock or type <span class="kbd">help</span>.</p>
      <div class="keys">
        <div><span class="kbd">Ctrl</span> + <span class="kbd">Space</span> launcher</div>
        <div><span class="kbd">Ctrl</span> + <span class="kbd">Alt</span> + <span class="kbd">T</span> terminal</div>
        <div><span class="kbd">Ctrl</span> + <span class="kbd">1-4</span> workspaces</div>
        <div><span class="kbd">Alt</span> + <span class="kbd">Tab</span> cycle windows</div>
      </div>
      <div class="row-btns">
        <button class="btn" data-go="terminal">Open terminal</button>
        <button class="btn ghost" data-go="projects">See projects</button>
      </div>
    `;
    body.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => openApp(b.dataset.go)));
  }

  function paintAbout(win, body) {
    body.className = "win-body pad";
    body.innerHTML = `
      <div class="hero">
        <img src="${esc(D.avatar)}" alt="${esc(D.user)}" />
        <div>
          <h1>${esc(D.user)}</h1>
          <p>${esc(D.title)}</p>
          <p>${esc(D.location)}</p>
        </div>
      </div>
      <div class="chips">${D.skills[0].items.concat(["Workers", "FPGA"]).slice(0, 6).map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>
      <div class="prose">${D.bio.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      <p><a class="text-link" href="${esc(D.github)}" target="_blank" rel="noopener">github.com/${esc(D.user)}</a></p>
    `;
  }

  function paintProjects(win, body) {
    body.className = "win-body pad";
    body.innerHTML = `<div class="project-grid">${D.projects
      .map((p) => {
        const links = [
          p.href ? `<a href="${esc(p.href)}" target="_blank" rel="noopener">live</a>` : "",
          p.repo ? `<a href="${esc(p.repo)}" target="_blank" rel="noopener">repo</a>` : "",
        ]
          .filter(Boolean)
          .join("");
        return `<article class="project">
          <header><h3>${esc(p.name)}</h3><span class="tag">${esc(p.tag)} · ${esc(p.year)}</span></header>
          <p>${esc(p.blurb)}</p>
          <div class="chips">${p.stack.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>
          <div class="links">${links || `<span class="dim" style="color:var(--muted);font-size:12px">local machine</span>`}</div>
        </article>`;
      })
      .join("")}</div>`;
  }

  function paintSkills(win, body) {
    body.className = "win-body pad";
    body.innerHTML = D.skills
      .map(
        (g) => `<div class="skill-group"><h3>${esc(g.group)}</h3><div class="skill-row">${g.items
          .map((i) => `<span class="skill">${esc(i)}</span>`)
          .join("")}</div></div>`
      )
      .join("");
  }

  function paintContact(win, body) {
    body.className = "win-body pad";
    body.innerHTML = `
      <h2 style="margin:0 0 8px">Mail</h2>
      <p class="prose">Queued locally to <span class="kbd">/var/spool/mail/${esc(D.user)}</span>. Prefer GitHub for anything real.</p>
      <p style="margin:0 0 12px"><a class="text-link" href="${esc(D.github)}" target="_blank" rel="noopener">${esc(D.github)}</a></p>
      <form class="contact-form" id="mail-form">
        <input name="from" placeholder="your name or email" required />
        <input name="subject" placeholder="subject" required />
        <textarea name="body" placeholder="say hello" required></textarea>
        <div class="row-btns">
          <button class="btn" type="submit">send</button>
          <button class="btn ghost" type="button" id="copy-mail">copy instead</button>
        </div>
        <p class="mail-status" style="color:var(--muted);margin:0;font-size:13px"></p>
      </form>
    `;
    const form = body.querySelector("#mail-form");
    const status = body.querySelector(".mail-status");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      status.textContent = `queued: ${fd.get("subject")} — this desktop has no SMTP, so also ping GitHub.`;
      notify("postfix", "mail queued (demo)");
      form.reset();
    });
    body.querySelector("#copy-mail").addEventListener("click", async () => {
      const fd = new FormData(form);
      const text = `To: ${D.user}\nFrom: ${fd.get("from")}\nSubject: ${fd.get("subject")}\n\n${fd.get("body")}`;
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = "copied to clipboard";
      } catch {
        status.textContent = "could not copy — select and copy manually";
      }
    });
  }

  function paintSettings(win, body) {
    body.className = "win-body pad settings";
    const theme = localStorage.getItem("helix-theme") || "helix";
    const skip = localStorage.getItem("helix-skip-boot") === "1";
    body.innerHTML = `
      <h2 style="margin:0 0 8px">Settings</h2>
      <label for="theme-sel">Theme</label>
      <select id="theme-sel">
        <option value="helix">Helix (brass / seafoam)</option>
        <option value="phosphor">Phosphor</option>
        <option value="nord">Nord</option>
        <option value="rose">Rose</option>
      </select>
      <label style="margin-top:14px"><input type="checkbox" id="skip-boot" ${skip ? "checked" : ""}/> Skip boot next time</label>
      <p style="color:var(--muted);font-size:13px;margin-top:16px">Wallpaper lives at <span class="kbd">~/Pictures/wallpaper.jpg</span>. Lock screen uses the same rice.</p>
    `;
    body.querySelector("#theme-sel").value = theme;
    body.querySelector("#theme-sel").addEventListener("change", (e) => {
      applyTheme(e.target.value);
    });
    body.querySelector("#skip-boot").addEventListener("change", (e) => {
      localStorage.setItem("helix-skip-boot", e.target.checked ? "1" : "0");
    });
  }

  function applyTheme(name) {
    localStorage.setItem("helix-theme", name);
    if (name === "helix") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.dataset.theme = name;
  }

  function paintFiles(win, body) {
    body.className = "win-body no-pad";
    win.filesPath = HOME;
    const render = () => {
      const rel = win.filesPath.replace(HOME, "~");
      const node = getNode(win.filesPath);
      const entries = node && node.type === "dir" ? Object.keys(node.children) : [];
      body.innerHTML = `
        <div class="files">
          <aside class="files-side">
            <button data-p="${HOME}">Home</button>
            <button data-p="${HOME}/Documents">Documents</button>
            <button data-p="${HOME}/Projects">Projects</button>
            <button data-p="${HOME}/Pictures">Pictures</button>
            <button data-p="${HOME}/.config">.config</button>
          </aside>
          <div class="files-main">
            <p class="path">${esc(rel)}</p>
            <div class="file-grid">
              ${
                win.filesPath !== HOME
                  ? `<button class="file-item" data-up="1"><span class="ico">↩</span><small>..</small></button>`
                  : ""
              }
              ${entries
                .map((name) => {
                  const child = node.children[name];
                  const dir = child && typeof child === "object";
                  const ico = dir ? "📁" : name.endsWith(".md") ? "📄" : name.endsWith(".jpg") ? "🖼" : "📃";
                  return `<button class="file-item" data-name="${esc(name)}"><span class="ico">${ico}</span><small>${esc(name)}</small></button>`;
                })
                .join("")}
            </div>
          </div>
        </div>
      `;
      body.querySelectorAll(".files-side button").forEach((b) => {
        b.classList.toggle("active", b.dataset.p === win.filesPath);
        b.addEventListener("click", () => {
          win.filesPath = b.dataset.p;
          render();
        });
      });
      body.querySelectorAll(".file-item").forEach((b) => {
        b.addEventListener("dblclick", () => activate());
        b.addEventListener("click", () => {
          if (window.innerWidth < 760) activate();
        });
        function activate() {
          if (b.dataset.up) {
            win.filesPath = parentPath(win.filesPath);
            render();
            return;
          }
          const next = win.filesPath.replace(/\/$/, "") + "/" + b.dataset.name;
          const n = getNode(next);
          if (!n) return;
          if (n.type === "dir") {
            win.filesPath = next;
            render();
          } else {
            openViewer(b.dataset.name, n.content);
          }
        }
      });
    };
    render();
    win.refocusFiles = render;
  }

  function paintHtop(win, body) {
    body.className = "win-body no-pad htop";
    const draw = () => {
      const cpu = 12 + Math.round(Math.random() * 28);
      const ram = 41 + Math.round(Math.random() * 8);
      const procs = [
        ["hyprfolio", 3.1, 84],
        ["helix-term", 1.4, 32],
        ["inspectlab", 0.8, 120],
        ["stickeredu", 0.6, 96],
        ["shoppilot", 0.4, 48],
        ["wayland", 2.2, 64],
      ];
      body.innerHTML = `
        <div>helix — ${esc(D.user)}@${esc(D.host)} — up ${uptime()}</div>
        <div>CPU ${cpu}%</div>
        <div class="bar-meter"><span style="width:${cpu}%"></span></div>
        <div>MEM ${ram}%</div>
        <div class="bar-meter"><span style="width:${ram}%"></span></div>
        <pre style="margin:8px 0 0">${esc("PID   NAME         CPU   MEM")}\n${procs
          .map((p, i) => `${String(1000 + i).padEnd(6)}${p[0].padEnd(13)}${String(p[1]).padEnd(6)}${p[2]}M`)
          .join("\n")}</pre>
      `;
    };
    draw();
    win.htopTimer = setInterval(draw, 1200);
  }

  function paintViewer(win, body) {
    renderViewer(win, win.payload || { name: "untitled", content: "" });
  }

  function renderViewer(win, payload) {
    win.payload = payload;
    win.title = payload.name;
    win.el.querySelector("h2").textContent = payload.name;
    const body = bodyOf(win);
    body.className = "win-body no-pad";
    body.innerHTML = `<pre class="term" style="margin:0;white-space:pre-wrap">${esc(payload.content)}</pre>`;
    updateBarTitle();
  }

  function openViewer(name, content) {
    openApp("viewer", { title: name, payload: { name, content } });
  }

  /* ---------------- filesystem ---------------- */
  function getNode(path) {
    const clean = normalizePath(path);
    if (clean === HOME || clean === "~") return { type: "dir", children: files };
    const rel = clean.startsWith(HOME + "/") ? clean.slice(HOME.length + 1) : clean.replace(/^~\//, "");
    const parts = rel.split("/").filter(Boolean);
    let node = files;
    for (let i = 0; i < parts.length; i++) {
      if (!node || typeof node !== "object" || Array.isArray(node) || node[parts[i]] === undefined) return null;
      const val = node[parts[i]];
      if (typeof val === "string") {
        return i === parts.length - 1 ? { type: "file", content: val } : null;
      }
      node = val;
    }
    return { type: "dir", children: node };
  }

  function normalizePath(path) {
    if (!path) return HOME;
    if (path === "~") return HOME;
    if (path.startsWith("~/")) return HOME + path.slice(1);
    if (path === "/") return "/";
    const parts = path.split("/");
    const out = [];
    const abs = path.startsWith("/");
    for (const p of parts) {
      if (!p || p === ".") continue;
      if (p === "..") out.pop();
      else out.push(p);
    }
    if (!abs) return null;
    return "/" + out.join("/");
  }

  function resolvePath(cwd, input) {
    if (!input) return cwd;
    let n;
    if (input.startsWith("~")) n = normalizePath(input);
    else if (input.startsWith("/")) n = normalizePath(input);
    else n = normalizePath(cwd.replace(/\/$/, "") + "/" + input);
    if (!n || (n !== HOME && !n.startsWith(HOME + "/"))) return HOME;
    return n;
  }

  function parentPath(path) {
    const n = normalizePath(path);
    if (n === HOME || n === "/") return HOME;
    return n.split("/").slice(0, -1).join("/") || "/";
  }

  function treeString(node, prefix = "") {
    if (!node || node.type !== "dir") return "";
    const names = Object.keys(node.children);
    return names
      .map((name, i) => {
        const last = i === names.length - 1;
        const child = node.children[name];
        const branch = prefix + (last ? "└── " : "├── ") + name + (typeof child === "object" && typeof child !== "string" ? "/" : "");
        if (typeof child === "string") return branch;
        return branch + "\n" + treeString({ type: "dir", children: child }, prefix + (last ? "    " : "│   "));
      })
      .join("\n");
  }

  /* ---------------- terminal ---------------- */
  function paintTerminal(win, body) {
    body.className = "win-body no-pad";
    body.innerHTML = `
      <div class="term">
        <div class="term-out"></div>
        <div class="term-line">
          <span class="prompt"></span>
          <input class="term-in" spellcheck="false" autocomplete="off" />
        </div>
      </div>
    `;
    const term = {
      cwd: HOME,
      hist: [],
      histI: -1,
      out: body.querySelector(".term-out"),
      input: body.querySelector(".term-in"),
      promptEl: body.querySelector(".prompt"),
      matrixTimer: null,
    };
    win.term = term;
    const print = (html) => {
      const div = document.createElement("div");
      div.innerHTML = html;
      term.out.appendChild(div);
      body.querySelector(".term").scrollTop = 99999;
    };
    const refreshPrompt = () => {
      const short = term.cwd === HOME ? "~" : term.cwd.replace(HOME + "/", "~/");
      term.promptEl.innerHTML = `<span class="cyan">${esc(D.user)}</span><span class="dim">@</span><span class="gold">${esc(D.host)}</span><span class="dim">:</span>${esc(short)}<span class="dim">$</span>`;
    };
    refreshPrompt();
    print(`<span class="dim">Helix shell. Type <span class="gold">help</span> — or just wander.</span>`);

    const run = (raw) => {
      const line = raw.trim();
      print(`<span class="prompt">${term.promptEl.innerHTML}</span> ${esc(raw)}`);
      if (!line) return;
      term.hist.push(line);
      term.histI = term.hist.length;
      const out = execCommand(line, term, win);
      if (out === "__CLEAR__") {
        term.out.innerHTML = "";
        return;
      }
      if (out) print(out);
      refreshPrompt();
    };

    term.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const v = term.input.value;
        term.input.value = "";
        run(v);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!term.hist.length) return;
        term.histI = Math.max(0, term.histI - 1);
        term.input.value = term.hist[term.histI];
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        term.histI = Math.min(term.hist.length, term.histI + 1);
        term.input.value = term.hist[term.histI] || "";
      } else if (e.key === "Tab") {
        e.preventDefault();
        const c = complete(term.input.value, term.cwd);
        if (c) term.input.value = c;
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        term.out.innerHTML = "";
      } else if (e.key === "c" && e.ctrlKey) {
        print(`<span class="dim">^C</span>`);
        term.input.value = "";
      }
    });

    body.querySelector(".term").addEventListener("click", () => term.input.focus());
    setTimeout(() => term.input.focus(), 30);
  }

  function tokenize(line) {
    const out = [];
    let cur = "";
    let q = null;
    for (const ch of line) {
      if (q) {
        if (ch === q) q = null;
        else cur += ch;
      } else if (ch === "'" || ch === '"') q = ch;
      else if (/\s/.test(ch)) {
        if (cur) out.push(cur);
        cur = "";
      } else cur += ch;
    }
    if (cur) out.push(cur);
    return out;
  }

  function execCommand(line, term, win) {
    const args = tokenize(line);
    const cmd = args[0];
    const rest = args.slice(1);
    const join = rest.join(" ");

    const commands = {
      help: () => `<span class="gold">commands</span>
  <span class="cyan">ls cd pwd cat tree</span>     filesystem
  <span class="cyan">neofetch whoami uname</span>   identity
  <span class="cyan">open about projects</span>     gui apps
  <span class="cyan">fortune cowsay sl</span>        toys
  <span class="cyan">theme github htop</span>        extras
  <span class="cyan">clear exit help man</span>`,
      man: () => `HELIX(1)\n\nA desktop portfolio. Apps live in the dock. The shell is real enough.\nSee also: help, neofetch, cat README.md`,
      whoami: () => D.user,
      hostname: () => D.host,
      pwd: () => term.cwd,
      date: () => new Date().toString(),
      clear: () => "__CLEAR__",
      exit: () => {
        closeWin(win);
        return "";
      },
      uname: () => (rest.includes("-a") ? `Helix ${D.kernel} ${D.host} GNU/Linux` : "Helix"),
      echo: () => esc(join),
      history: () => term.hist.map((h, i) => `${String(i + 1).padStart(4)}  ${esc(h)}`).join("\n"),
      github: () => {
        window.open(D.github, "_blank", "noopener");
        return `<span class="dim">opening ${esc(D.github)}</span>`;
      },
      fortune: () => esc(D.fortunes[Math.floor(Math.random() * D.fortunes.length)]),
      htop: () => {
        openApp("htop");
        return `<span class="dim">spawned monitor</span>`;
      },
      about: () => {
        openApp("about");
        return "";
      },
      projects: () => {
        openApp("projects");
        return D.projects.map((p) => `<span class="gold">${esc(p.name)}</span>  ${esc(p.tag)}`).join("\n");
      },
      skills: () => {
        openApp("skills");
        return D.skills.map((g) => `<span class="cyan">${esc(g.group)}</span>  ${esc(g.items.join(", "))}`).join("\n");
      },
      contact: () => {
        openApp("contact");
        return "";
      },
      open: () => {
        const id = rest[0];
        if (!id) return `<span class="err">open what? try: terminal files about projects skills contact settings htop</span>`;
        if (appById(id) || ["mail", "term"].includes(id)) {
          openApp(id === "mail" ? "contact" : id === "term" ? "terminal" : id);
          return "";
        }
        const path = resolvePath(term.cwd, id);
        const n = getNode(path);
        if (n && n.type === "file") {
          openViewer(id, n.content);
          return "";
        }
        return `<span class="err">open: no such app or file: ${esc(id)}</span>`;
      },
      theme: () => {
        const name = rest[0];
        if (!name) return "themes: helix, phosphor, nord, rose";
        if (!["helix", "phosphor", "nord", "rose"].includes(name)) return `<span class="err">unknown theme</span>`;
        applyTheme(name);
        return `theme → ${esc(name)}`;
      },
      ls: () => {
        const target = rest.filter((a) => !a.startsWith("-"))[0];
        const path = resolvePath(term.cwd, target || "");
        const n = getNode(path);
        if (!n) return `<span class="err">ls: ${esc(target || path)}: no such file</span>`;
        if (n.type === "file") return esc(path.split("/").pop());
        const names = Object.keys(n.children);
        const long = rest.includes("-l") || rest.includes("-la") || rest.includes("-al");
        if (!long) {
          return names
            .map((name) => {
              const c = n.children[name];
              const dir = typeof c === "object" && typeof c !== "string";
              return dir ? `<span class="cyan">${esc(name)}/</span>` : esc(name);
            })
            .join("  ");
        }
        return names
          .map((name) => {
            const c = n.children[name];
            const dir = typeof c === "object" && typeof c !== "string";
            const mode = dir ? "drwxr-xr-x" : "-rw-r--r--";
            const size = dir ? 4096 : String(c).length;
            return `${mode} ${D.user} ${String(size).padStart(5)} ${dir ? `<span class="cyan">${esc(name)}</span>` : esc(name)}`;
          })
          .join("\n");
      },
      cd: () => {
        const dest = rest[0] || HOME;
        const path = dest === "/" ? HOME : resolvePath(term.cwd, dest);
        const n = getNode(path);
        if (!n) return `<span class="err">cd: no such file or directory: ${esc(dest)}</span>`;
        if (n.type !== "dir") return `<span class="err">cd: not a directory: ${esc(dest)}</span>`;
        term.cwd = path;
        return "";
      },
      cat: () => {
        if (!rest[0]) return `<span class="err">cat: missing operand</span>`;
        return rest
          .map((f) => {
            const n = getNode(resolvePath(term.cwd, f));
            if (!n) return `<span class="err">cat: ${esc(f)}: no such file</span>`;
            if (n.type === "dir") return `<span class="err">cat: ${esc(f)}: is a directory</span>`;
            return esc(n.content);
          })
          .join("\n");
      },
      tree: () => {
        const path = resolvePath(term.cwd, rest[0] || "");
        const n = getNode(path);
        if (!n) return `<span class="err">tree: not found</span>`;
        if (n.type !== "dir") return esc(path.split("/").pop());
        const label = path === HOME ? "." : path.split("/").pop();
        return esc(label) + "/\n" + treeString(n);
      },
      neofetch: () => {
        const art = `<pre>      ╱╲
     ╱  ╲
    ╱ /\\ ╲
   ╱ /  \\ ╲
   ╲ \\  / ╱
    ╲ \\/ ╱
     ╲  ╱
      ╲╱</pre>`;
        const info = `<div>
<span class="cyan">${esc(D.user)}</span>@<span class="gold">${esc(D.host)}</span>
<span class="dim">-----------</span>
<span class="gold">OS</span>: ${esc(D.distro)}
<span class="gold">Host</span>: ntu-helix
<span class="gold">Kernel</span>: ${esc(D.kernel)}
<span class="gold">Uptime</span>: ${uptime()}
<span class="gold">Shell</span>: ${esc(D.shell)}
<span class="gold">DE</span>: ${esc(D.de)}
<span class="gold">Theme</span>: ${esc(localStorage.getItem("helix-theme") || "helix")}
<span class="gold">CPU</span>: curiosity × 8
<span class="gold">Memory</span>: just enough
<span class="gold">GitHub</span>: ${esc(D.github.replace("https://", ""))}
</div>`;
        return `<div class="neofetch">${art}${info}</div>`;
      },
      cowsay: () => {
        const msg = join || "moo from helix";
        const line = "-".repeat(Math.min(40, msg.length + 2));
        return `<pre> ${line}\n&lt; ${esc(msg)} &gt;\n ${line}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||</pre>`;
      },
      sl: () => `<pre>      ====        ________                ________
  _D _|  |_______/        \\__I_I_____===__|________|
   |(_)---  |   H\\________/ |   |        =|___ ___|
   /     |  |   H  |  |     |   |         ||_| |_||
  |      |  |   H  |__--------------------| [___] |
  | ________|___H__/__|_____/[][]~\\_______|       |
  |/ |   |-----------I_____I [][] []  D   |=======|
__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__
 |/-=|___|=    ||    ||    ||    |_____/~\\___/
  \\_/      \\O=====O=====O=====O_/      \\_/</pre><span class="dim">choo choo</span>`,
      sudo: () => `<span class="err">${esc(D.user)} is not in the sudoers file. This incident will be reported to /dev/null.</span>`,
      rm: () => {
        if (rest.includes("-rf") && (rest.includes("/") || rest.includes("~") || rest.includes("*"))) {
          return `<span class="err">nice try. Helix is mounted read-only for visitors.</span>`;
        }
        return `<span class="err">rm: permission denied (portfolio is immutable)</span>`;
      },
      vim: () => vimLike(rest, term),
      nano: () => vimLike(rest, term),
      cmatrix: () => startMatrix(win, term),
      ping: () => `PING ${esc(rest[0] || D.host)} (127.0.0.1): 56 data bytes\n64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.4 ms\n--- ${esc(rest[0] || D.host)} ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss`,
      curl: () => `<span class="dim">curl: (6) this desktop is air-gapped except for the links in Projects.</span>`,
      ssh: () => `The authenticity of host '${esc(rest[0] || "github.com")}' can't be established.\n<span class="dim">just kidding — use the GitHub app link instead.</span>`,
    };

    if (commands[cmd]) {
      try {
        return commands[cmd]();
      } catch (err) {
        return `<span class="err">${esc(cmd)}: ${esc(err.message)}</span>`;
      }
    }
    return `<span class="err">helix: command not found: ${esc(cmd)}. Try help.</span>`;
  }

  function vimLike(rest, term) {
    if (!rest[0]) return `<span class="dim">// this vim is a viewer. usage: vim about.txt — then it opens in Reader. :q is a window close.</span>`;
    const n = getNode(resolvePath(term.cwd, rest[0]));
    if (!n) return `<span class="err">e448: No file named ${esc(rest[0])}</span>`;
    if (n.type === "dir") return `<span class="err">${esc(rest[0])} is a directory</span>`;
    openViewer(rest[0], n.content);
    return `<span class="dim">opened in Reader  (real vim is a lifestyle)</span>`;
  }

  function startMatrix(win, term) {
    const host = win.el.querySelector(".term");
    const overlay = document.createElement("div");
    overlay.className = "matrix-overlay";
    overlay.textContent = "wake up, visitor…";
    host.appendChild(overlay);
    const cols = Math.max(20, Math.floor(host.clientWidth / 12));
    const tick = () => {
      let s = "";
      for (let r = 0; r < 18; r++) {
        for (let c = 0; c < cols; c++) s += String.fromCharCode(0x30a0 + Math.floor(Math.random() * 90));
        s += "\n";
      }
      overlay.textContent = s;
    };
    term.matrixTimer = setInterval(tick, 80);
    tick();
    const stop = () => {
      clearInterval(term.matrixTimer);
      term.matrixTimer = null;
      overlay.remove();
      document.removeEventListener("keydown", stop);
    };
    setTimeout(() => document.addEventListener("keydown", stop), 100);
    return `<span class="dim">cmatrix — press any key to wake</span>`;
  }

  function complete(value, cwd) {
    const parts = value.split(/\s+/);
    const last = parts[parts.length - 1] || "";
    if (parts.length <= 1) {
      const cmds = ["help", "ls", "cd", "cat", "tree", "neofetch", "open", "projects", "about", "skills", "contact", "fortune", "cowsay", "theme", "github", "htop", "clear", "cmatrix", "sl"];
      const m = cmds.filter((c) => c.startsWith(last));
      return m[0] || value;
    }
    const node = getNode(cwd);
    if (!node || node.type !== "dir") return value;
    const m = Object.keys(node.children).filter((n) => n.startsWith(last.replace(/^\.\//, "")));
    if (!m[0]) return value;
    parts[parts.length - 1] = m[0];
    return parts.join(" ");
  }

  /* ---------------- chrome extras ---------------- */
  function notify(title, body) {
    const stack = $("#notify-stack");
    const el = document.createElement("div");
    el.className = "notify";
    el.innerHTML = `<b>${esc(title)}</b><p>${esc(body)}</p>`;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  const desktop = $("#desktop");
  desktop.addEventListener("contextmenu", (e) => {
    if (e.target.closest(".window") || e.target.closest(".dock") || e.target.closest(".waybar") || e.target.closest(".launcher")) return;
    e.preventDefault();
    const menu = $("#context-menu");
    menu.style.left = e.clientX + "px";
    menu.style.top = e.clientY + "px";
    menu.classList.remove("hidden");
    menu.innerHTML = `
      <button data-act="term">Open terminal</button>
      <button data-act="files">Open files</button>
      <button data-act="theme">Cycle theme</button>
      <button data-act="about">About</button>
    `;
    menu.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        menu.classList.add("hidden");
        if (b.dataset.act === "term") openApp("terminal");
        if (b.dataset.act === "files") openApp("files");
        if (b.dataset.act === "about") openApp("about");
        if (b.dataset.act === "theme") {
          const order = ["helix", "phosphor", "nord", "rose"];
          const cur = localStorage.getItem("helix-theme") || "helix";
          applyTheme(order[(order.indexOf(cur) + 1) % order.length]);
        }
      })
    );
  });
  document.addEventListener("click", () => $("#context-menu").classList.add("hidden"));

  window.addEventListener("keydown", (e) => {
    if (state.screen !== "desktop") return;
    if (e.key === "Escape") {
      closeLauncher();
      $("#calendar-pop").classList.add("hidden");
    }
    if (e.ctrlKey && e.altKey && (e.key === "t" || e.key === "T")) {
      e.preventDefault();
      openApp("terminal");
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      openApp("terminal");
    }
    if (e.code === "Space" && e.ctrlKey) {
      e.preventDefault();
      toggleLauncher();
    }
    if (e.key === "e" && (e.metaKey || (e.ctrlKey && e.shiftKey))) {
      e.preventDefault();
      openApp("files");
    }
    if ((e.key === "q" || e.key === "Q") && e.altKey && !e.ctrlKey) {
      e.preventDefault();
      const top = [...state.windows].filter((w) => w.workspace === state.workspace && !w.minimized).sort((a, b) => b.z - a.z)[0];
      if (top) closeWin(top);
    }
    if (e.altKey && e.key === "Tab") {
      e.preventDefault();
      const list = state.windows.filter((w) => w.workspace === state.workspace && !w.minimized);
      if (list.length < 2) return;
      list.sort((a, b) => b.z - a.z);
      focusWin(list[list.length - 1]);
    }
    if ((e.ctrlKey || e.metaKey) && ["1", "2", "3", "4"].includes(e.key) && !e.altKey) {
      e.preventDefault();
      setWorkspace(Number(e.key));
    }
    if (e.key === "l" && e.metaKey) {
      e.preventDefault();
      lockNow();
    }
  });

  function lockNow() {
    state.windows.forEach((w) => {
      if (w.htopTimer) clearInterval(w.htopTimer);
    });
    $("#desktop").classList.add("hidden");
    $("#lock").classList.remove("hidden");
    state.screen = "lock";
    $("#unlock-pass").value = "";
    $("#unlock-pass").focus();
  }

  boot();
})();
