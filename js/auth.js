/* Autenticación y roles – Formatos UGI / Secretaría de Salud
 *
 * IMPORTANTE: este módulo funciona 100 % en el navegador (localStorage), igual que el resto
 * del proyecto. Sirve para separar vistas y permisos, pero NO es seguridad real: cualquiera con
 * acceso a la consola del navegador puede saltárselo. Para producción, la validación de usuarios,
 * contraseñas y permisos debe hacerse en un servidor (ver INSTRUCCIONES.md).
 */
(function () {
  'use strict';
  const USERS_KEY = 'ugi_users', SESSION_KEY = 'ugi_session', FAIL_KEY = 'ugi_login_fail';
  const SESSION_MS = 8 * 60 * 60 * 1000;
  const A = (window.Auth = {});

  /* ---------- Roles ---------- */
  A.ROLES = {
    ADMINISTRADOR: { label: 'Administrador', staff: true, home: 'panel.html', icon: 'shield', desc: 'Acceso total y gestión de usuarios' },
    DESARROLLADOR: { label: 'Desarrollador', staff: true, home: 'solicitudes.html', icon: 'code', desc: 'Consulta de solicitudes' },
    SUPERVISOR: { label: 'Supervisor', staff: true, home: 'etapas.html', icon: 'activity', desc: 'Seguimiento de etapas' },
    USUARIO: { label: 'Usuario', staff: false, home: 'index.html', icon: 'user', desc: 'Formatos de solicitud' },
  };
  A.ROLE_KEYS = Object.keys(A.ROLES);

  const MENU = [
    { href: 'panel.html', icon: 'grid', text: 'Panel', roles: ['ADMINISTRADOR'] },
    { href: 'index.html', icon: 'file-text', text: 'Formatos', roles: ['USUARIO', 'ADMINISTRADOR'] },
    { href: 'requerimiento.html', icon: 'file-plus', text: 'Solicitud de Requerimiento', roles: ['USUARIO', 'ADMINISTRADOR'] },
    { href: 'cambios.html', icon: 'refresh-cw', text: 'Solicitud de Cambios', roles: ['USUARIO', 'ADMINISTRADOR'] },
    { href: 'solicitudes.html', icon: 'list', text: 'Solicitudes', roles: ['DESARROLLADOR', 'ADMINISTRADOR'] },
    { href: 'etapas.html', icon: 'layers', text: 'Etapas de desarrollo', roles: ['SUPERVISOR', 'ADMINISTRADOR'] },
    { href: 'usuarios.html', icon: 'users', text: 'Usuarios', roles: ['ADMINISTRADOR'] },
  ];
  A.menuFor = (role) => MENU.filter((i) => i.roles.includes(role));

  /* ---------- Almacenamiento ---------- */
  const read = (k, store) => { try { return JSON.parse((store || localStorage).getItem(k)); } catch (e) { return null; } };
  const write = (k, v, store) => { try { (store || localStorage).setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const norm = (e) => String(e || '').trim().toLowerCase();
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  A.users = () => read(USERS_KEY) || [];
  A.saveUsers = (l) => write(USERS_KEY, l);
  A.hasUsers = () => A.users().length > 0;
  A.userById = (id) => A.users().find((u) => u.id === id) || null;

  /* ---------- Hash de contraseñas (SHA-256 con sal, 10 000 rondas, JS puro) ----------
   * Se usa JS puro y no crypto.subtle porque esta última no existe en páginas http:// de intranet. */
  const PR = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131,
    137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311];
  const frac = (x) => Math.floor((x - Math.floor(x)) * 4294967296) >>> 0;
  const K = PR.map((p) => frac(Math.cbrt(p)));
  const H0 = PR.slice(0, 8).map((p) => frac(Math.sqrt(p)));
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  function sha256(m) {
    const l = m.length, nb = (l + 9 + 63) >> 6, buf = new Uint8Array(nb * 64);
    buf.set(m); buf[l] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(buf.length - 8, Math.floor((l * 8) / 4294967296)); dv.setUint32(buf.length - 4, (l * 8) >>> 0);
    const h = H0.slice(), w = new Uint32Array(64);
    for (let i = 0; i < nb; i++) {
      for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i * 64 + t * 4);
      for (let t = 16; t < 64; t++) {
        const a = w[t - 15], b = w[t - 2];
        w[t] = (w[t - 16] + (rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) + w[t - 7] + (rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10))) >>> 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let t = 0; t < 64; t++) {
        const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + w[t]) >>> 0;
        const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      [a, b, c, d, e, f, g, hh].forEach((v, j) => { h[j] = (h[j] + v) >>> 0; });
    }
    const out = new Uint8Array(32), odv = new DataView(out.buffer);
    h.forEach((v, j) => odv.setUint32(j * 4, v));
    return out;
  }
  const hex = (u8) => Array.from(u8).map((b) => b.toString(16).padStart(2, '0')).join('');
  const enc = (s) => new TextEncoder().encode(s);
  function hashPw(pw, salt) {
    let h = sha256(enc(salt + ':' + pw));
    const s = enc(salt);
    for (let i = 0; i < 10000; i++) { const t = new Uint8Array(h.length + s.length); t.set(h); t.set(s, h.length); h = sha256(t); }
    return hex(h);
  }
  A._sha256hex = (s) => hex(sha256(enc(s))); // para pruebas
  const randHex = (n) => { const a = new Uint8Array(n); (window.crypto || window.msCrypto).getRandomValues(a); return hex(a); };
  const sameStr = (a, b) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };

  /* ---------- Contraseñas ---------- */
  A.passwordProblem = (pw) => {
    pw = String(pw || '');
    if (pw.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'La contraseña debe incluir letras y números';
    return '';
  };
  A.genPassword = () => {
    const L = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz', D = '23456789', ALL = L + D + '#$%&*+?';
    const a = new Uint32Array(14); (window.crypto || window.msCrypto).getRandomValues(a);
    const out = Array.from(a, (n) => ALL[n % ALL.length]);
    out[0] = L[a[0] % L.length]; out[1] = D[a[1] % D.length];
    return out.sort(() => 0.5 - Math.random()).join('');
  };

  /* ---------- Usuarios ---------- */
  A.createUser = (o) => {
    const users = A.users();
    const email = norm(o.email), username = String(o.username || '').trim(), name = String(o.name || '').trim();
    if (!A.ROLES[o.role]) throw new Error('Rol no válido');
    if (!name) throw new Error('Ingresa el nombre completo');
    if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) throw new Error('El nombre de usuario debe tener de 3 a 30 caracteres (letras, números, punto, guion)');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Ingresa un correo electrónico válido');
    const pwErr = A.passwordProblem(o.password); if (pwErr) throw new Error(pwErr);
    if (users.some((u) => u.email === email)) throw new Error('Ya existe una cuenta con ese correo');
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) throw new Error('Ese nombre de usuario ya está en uso');
    const salt = randHex(16);
    const u = {
      id: uid(), role: o.role, name, username, email, salt, hash: hashPw(o.password, salt),
      active: true, created: new Date().toISOString(), createdBy: o.createdBy || null, profile: o.profile || {},
    };
    users.push(u);
    if (!A.saveUsers(users)) throw new Error('No se pudo guardar: el almacenamiento del navegador está bloqueado o lleno');
    return u;
  };
  A.updateUser = (id, patch) => {
    const users = A.users(), i = users.findIndex((u) => u.id === id);
    if (i < 0) throw new Error('Usuario no encontrado');
    users[i] = Object.assign({}, users[i], patch);
    A.saveUsers(users); return users[i];
  };
  A.setPassword = (id, pw) => {
    const err = A.passwordProblem(pw); if (err) throw new Error(err);
    const salt = randHex(16);
    return A.updateUser(id, { salt, hash: hashPw(pw, salt) });
  };
  A.deleteUser = (id) => A.saveUsers(A.users().filter((u) => u.id !== id));
  A.activeAdmins = () => A.users().filter((u) => u.role === 'ADMINISTRADOR' && u.active);

  /* ---------- Sesión ---------- */
  A.startSession = (u) => write(SESSION_KEY, { id: u.id, at: Date.now() }, sessionStorage);
  A.current = () => {
    const s = read(SESSION_KEY, sessionStorage);
    if (!s || Date.now() - s.at > SESSION_MS) return null;
    const u = A.userById(s.id);
    return u && u.active ? u : null;
  };
  A.logout = () => { try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* nada */ } location.replace('login.html'); };

  A.login = (email, pw, role) => {
    const k = norm(email), fails = read(FAIL_KEY) || {}, f = fails[k];
    if (f && f.until && f.until > Date.now()) throw new Error('Demasiados intentos fallidos. Espera ' + Math.ceil((f.until - Date.now()) / 1000) + ' s e inténtalo de nuevo.');
    const u = A.users().find((x) => x.email === k);
    const hOk = sameStr(hashPw(pw || '', u ? u.salt : 'x'), u ? u.hash : '0'.repeat(64)); // siempre calcula el hash
    if (u && hOk && u.role === role) {
      if (!u.active) throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
      delete fails[k]; write(FAIL_KEY, fails);
      A.startSession(u); return u;
    }
    const n = ((f && f.n) || 0) + 1;
    fails[k] = n >= 5 ? { n: 0, until: Date.now() + 60000 } : { n };
    write(FAIL_KEY, fails);
    throw new Error('Correo, contraseña o rol incorrectos. Verifica que hayas elegido el rol correcto.');
  };

  A.changeOwnPassword = (cur, next) => {
    const u = A.current(); if (!u) throw new Error('Sesión expirada');
    if (!sameStr(hashPw(cur || '', u.salt), u.hash)) throw new Error('La contraseña actual no es correcta');
    A.setPassword(u.id, next);
  };

  /* ---------- Permisos y protección de páginas ---------- */
  const pageName = () => location.pathname.split('/').pop() || 'index.html';
  A.can = (roles) => { const u = A.current(); return !!u && roles.includes(u.role); };
  A.readonly = () => { const u = A.current(); return !!u && u.role === 'DESARROLLADOR'; };
  A.canOpen = (rec) => {
    const u = A.current(); if (!u || !rec) return false;
    if (u.role === 'ADMINISTRADOR' || u.role === 'DESARROLLADOR') return true;
    if (u.role === 'USUARIO') return rec.owner === u.id;
    return false;
  };
  /* Devuelve null si el rol actual puede ver la página, o la URL a la que hay que enviarlo */
  A.guardTarget = (roles, opts) => {
    opts = opts || {};
    const u = A.current();
    if (!u) return 'login.html?next=' + encodeURIComponent(pageName() + location.search);
    const hasId = !!new URLSearchParams(location.search).get('id');
    if (roles.includes(u.role) || ((opts.viewWithId || []).includes(u.role) && hasId)) return null;
    return A.ROLES[u.role].home;
  };
  /* guard(['USUARIO','ADMINISTRADOR'], { viewWithId: ['DESARROLLADOR'] }) */
  A.guard = (roles, opts) => {
    const t = A.guardTarget(roles, opts);
    if (!t) return true;
    document.documentElement.style.visibility = 'hidden';
    location.replace(t);
    return false;
  };

  /* ---------- Iconos (SVG en línea, sin dependencias) ---------- */
  const P = {
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    'file-plus': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>',
    'refresh-cw': '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
    menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    chevron: '<polyline points="6 9 12 15 18 9"/>',
  };
  A.icon = (n, size) => `<svg class="ic" width="${size || 18}" height="${size || 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  A.esc = esc;
  A.initials = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  A.roleBadge = (r) => `<span class="pill role-${esc(r)}">${esc((A.ROLES[r] || {}).label || r)}</span>`;

  /* ---------- Estructura de la aplicación (menú lateral + barra superior) ---------- */
  A.mountShell = () => {
    const u = A.current(); if (!u || document.body.classList.contains('has-shell')) return;
    document.querySelectorAll('.topbar').forEach((e) => e.remove());
    document.body.classList.add('has-shell');
    let page = pageName();
    if (u.role === 'DESARROLLADOR' && (page === 'requerimiento.html' || page === 'cambios.html')) page = 'solicitudes.html';

    const nav = A.menuFor(u.role).map((i) =>
      `<a href="${i.href}" class="${i.href === page ? 'active' : ''}" ${i.href === page ? 'aria-current="page"' : ''}>${A.icon(i.icon)}<span>${esc(i.text)}</span></a>`).join('');
    const kids = Array.from(document.body.childNodes).filter((n) => !(n.nodeType === 1 && (n.tagName === 'SCRIPT' || n.id === 'toast')) && !(n.nodeType === 3 && !n.textContent.trim()));

    const app = document.createElement('div');
    app.className = 'app';
    app.innerHTML = `
      <aside class="side no-print" id="side" aria-label="Menú principal">
        <div class="side-brand"><strong>UGI</strong><span>Secretaría de Salud</span></div>
        <nav>${nav}</nav>
        <div class="side-foot">Sesión: ${A.roleBadge(u.role)}</div>
      </aside>
      <div class="scrim no-print" id="scrim"></div>
      <div class="main-col">
        <header class="appbar no-print">
          <button class="icon-flat burger" id="burger" aria-label="Abrir menú">${A.icon('menu', 22)}</button>
          <span class="appbar-title">Formatos de solicitud</span>
          <span class="spacer"></span>
          <div class="umenu">
            <button class="uchip" id="uchip" aria-haspopup="true" aria-expanded="false">
              <span class="avatar">${esc(A.initials(u.name))}</span>
              <span class="uinfo"><b>${esc(u.name)}</b><small>${esc(A.ROLES[u.role].label)}</small></span>
              ${A.icon('chevron', 16)}
            </button>
            <div class="udrop" id="udrop" hidden>
              <div class="udrop-head"><b>${esc(u.name)}</b><small>${esc(u.email)}</small>${A.roleBadge(u.role)}</div>
              <button id="m-pass">${A.icon('key')} Cambiar contraseña</button>
              <button id="m-out">${A.icon('log-out')} Cerrar sesión</button>
            </div>
          </div>
        </header>
        <div class="content" id="content"></div>
      </div>
      <dialog id="dlg-pass" class="dlg">
        <form method="dialog" id="f-pass" novalidate>
          <h3>Cambiar contraseña</h3>
          <label class="field"><span class="lbl">Contraseña actual</span><input type="password" id="p-cur" autocomplete="current-password" required></label>
          <label class="field"><span class="lbl">Nueva contraseña</span><input type="password" id="p-new" autocomplete="new-password" required><small class="muted">Mínimo 8 caracteres, con letras y números.</small></label>
          <label class="field"><span class="lbl">Confirmar nueva contraseña</span><input type="password" id="p-new2" autocomplete="new-password" required></label>
          <p class="form-err" id="p-err" role="alert" hidden></p>
          <div class="dlg-actions"><button type="button" class="btn ghost" id="p-cancel">Cancelar</button><button type="submit" class="btn">Guardar</button></div>
        </form>
      </dialog>`;
    document.body.insertBefore(app, document.body.firstChild);
    const content = app.querySelector('#content');
    kids.forEach((n) => { if (n !== app) content.appendChild(n); });

    const side = app.querySelector('#side'), scrim = app.querySelector('#scrim');
    const closeSide = () => { side.classList.remove('open'); scrim.classList.remove('show'); };
    app.querySelector('#burger').addEventListener('click', () => { side.classList.add('open'); scrim.classList.add('show'); });
    scrim.addEventListener('click', closeSide);

    const chip = app.querySelector('#uchip'), drop = app.querySelector('#udrop');
    const setDrop = (o) => { drop.hidden = !o; chip.setAttribute('aria-expanded', String(o)); };
    chip.addEventListener('click', (e) => { e.stopPropagation(); setDrop(drop.hidden); });
    document.addEventListener('click', (e) => { if (!drop.contains(e.target)) setDrop(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setDrop(false); closeSide(); } });
    app.querySelector('#m-out').addEventListener('click', A.logout);

    const dlg = app.querySelector('#dlg-pass'), perr = app.querySelector('#p-err');
    app.querySelector('#m-pass').addEventListener('click', () => {
      setDrop(false); app.querySelector('#f-pass').reset(); perr.hidden = true;
      dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
    });
    app.querySelector('#p-cancel').addEventListener('click', () => dlg.close());
    if (window.UGI && UGI.autosize) UGI.autosize();
    app.querySelector('#f-pass').addEventListener('submit', (e) => {
      e.preventDefault();
      const cur = app.querySelector('#p-cur').value, n1 = app.querySelector('#p-new').value, n2 = app.querySelector('#p-new2').value;
      try {
        if (n1 !== n2) throw new Error('Las contraseñas nuevas no coinciden');
        A.changeOwnPassword(cur, n1);
        dlg.close();
        if (window.UGI) UGI.toast('Contraseña actualizada', 'ok');
      } catch (er) { perr.textContent = er.message; perr.hidden = false; }
    });
  };

  /* ---------- Modo solo lectura (Desarrollador) ---------- */
  A.applyReadonly = (form) => {
    if (!A.readonly() || !form) return;
    form.classList.add('is-readonly');
    Array.from(form.elements).forEach((el) => { el.disabled = true; });
    ['#b-clear', '#b-json', '[type="submit"]'].forEach((s) => form.querySelectorAll(s).forEach((e) => { e.hidden = true; }));
    const pr = form.querySelector('#b-print'); if (pr) pr.disabled = false;
    const st = form.querySelector('#status'); if (st) st.textContent = '';
    const b = document.createElement('p');
    b.className = 'note ro-banner no-print';
    b.innerHTML = '<strong>Modo solo lectura.</strong> Tu rol (Desarrollador) puede consultar esta solicitud, pero no modificarla.';
    form.insertBefore(b, form.firstChild);
  };

  document.addEventListener('DOMContentLoaded', () => { if (document.body && document.body.hasAttribute('data-shell')) A.mountShell(); });
})();
