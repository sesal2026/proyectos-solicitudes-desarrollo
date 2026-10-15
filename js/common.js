/* Utilidades compartidas – Formatos UGI / Secretaría de Salud */
(function () {
  'use strict';
  const KEY = 'ugi_solicitudes';
  const U = (window.UGI = {});

  /* ---------- Almacenamiento local (navegador) ---------- */
  U.list = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  U.store = (l) => {
    try { localStorage.setItem(KEY, JSON.stringify(l)); return true; }
    catch (e) { U.toast('No se pudo guardar: el almacenamiento del navegador está bloqueado o lleno', 'error'); return false; }
  };
  U.get = (id) => U.list().find((r) => r.id === id);
  U.upsert = (rec) => {
    const l = U.list(); const i = l.findIndex((r) => r.id === rec.id);
    if (i >= 0) l[i] = rec; else l.unshift(rec);
    return U.store(l);
  };
  U.remove = (id) => U.store(U.list().filter((r) => r.id !== id));
  /* Los borradores se separan por usuario para que dos personas en el mismo equipo no se mezclen */
  const dk = (k) => 'ugi_draft_' + ((window.Auth && Auth.current()) ? Auth.current().id + '_' : '') + k;
  U.draftGet = (k) => { try { return JSON.parse(localStorage.getItem(dk(k))); } catch (e) { return null; } };
  U.draftSet = (k, d) => { try { localStorage.setItem(dk(k), JSON.stringify(d)); return true; } catch (e) { return false; } };
  U.draftDel = (k) => { try { localStorage.removeItem(dk(k)); } catch (e) { /* nada */ } };

  /* ---------- Roles: visibilidad de solicitudes y etapas ---------- */
  U.visible = () => {
    const me = window.Auth && Auth.current(), l = U.list();
    return me && me.role === 'USUARIO' ? l.filter((r) => r.owner === me.id) : l;
  };
  U.ETAPAS = ['Recibida', 'En análisis', 'En desarrollo', 'En pruebas QA', 'Implementada', 'Rechazada'];
  U.FLOW = U.ETAPAS.slice(0, 5);
  U.etapaOf = (r) => (r && U.ETAPAS.includes(r.etapa) ? r.etapa : 'Recibida');
  U.etapaPill = (r) => { const e = typeof r === 'string' ? r : U.etapaOf(r); return `<span class="pill et-${U.ETAPAS.indexOf(e)}">${U.esc(e)}</span>`; };
  U.TIPOS = { cambios: 'Cambios en ambientes', requerimiento: 'Requerimiento de cambios' };
  U.PAGES = { cambios: 'cambios.html', requerimiento: 'requerimiento.html' };

  /* ---------- Helpers ---------- */
  U.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  U.today = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  U.fmtDate = (iso) => {
    if (!iso) return '';
    const p = String(iso).slice(0, 10).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
  };
  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.$ = (s, r) => (r || document).querySelector(s);
  U.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  U.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  U.toast = (msg, type) => {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.className = 'show ' + (type || '');
    t.textContent = msg;
    clearTimeout(U._tt);
    U._tt = setTimeout(() => { t.className = type || ''; }, 3200);
  };

  U.download = (name, text, mime) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: mime || 'application/json' }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };

  /* ---------- Serializar / restaurar formularios ---------- */
  U.collect = (form) => {
    const d = {};
    Array.from(form.elements).forEach((el) => {
      if (!el.name || el.type === 'file' || el.type === 'button' || el.type === 'submit') return;
      const arr = el.name.endsWith('[]');
      const k = arr ? el.name.slice(0, -2) : el.name;
      if (el.type === 'radio') { if (el.checked) d[k] = el.value; }
      else if (el.type === 'checkbox') {
        if (arr) { d[k] = d[k] || []; if (el.checked) d[k].push(el.value); } else d[k] = el.checked;
      } else if (arr) { (d[k] = d[k] || []).push(el.value); }
      else d[k] = el.value;
    });
    return d;
  };

  U.fill = (form, data) => {
    data = data || {};
    const idx = {};
    Array.from(form.elements).forEach((el) => {
      if (!el.name || el.type === 'file' || el.type === 'button' || el.type === 'submit') return;
      const arr = el.name.endsWith('[]');
      const k = arr ? el.name.slice(0, -2) : el.name;
      if (el.type === 'radio') el.checked = data[k] === el.value;
      else if (el.type === 'checkbox') el.checked = arr ? (data[k] || []).includes(el.value) : !!data[k];
      else if (arr) { idx[k] = idx[k] || 0; const v = (data[k] || [])[idx[k]++]; el.value = v == null ? '' : v; }
      else if (k in data) el.value = data[k];
    });
  };

  /* ---------- Tablas dinámicas (filas basadas en <template>) ---------- */
  U.rows = (tbody) => U.$$('tr', tbody);
  U.setRows = (tbody, n) => {
    const tpl = U.$('template', tbody);
    let rows = U.rows(tbody);
    while (rows.length < n) { tbody.appendChild(tpl.content.cloneNode(true)); rows = U.rows(tbody); }
    while (rows.length > n) { rows.pop().remove(); }
  };
  U.initDynTables = (root, onChange) => {
    root.addEventListener('click', (e) => {
      const add = e.target.closest('[data-add]');
      if (add) {
        const tb = document.getElementById(add.dataset.add);
        U.setRows(tb, U.rows(tb).length + 1);
        const last = U.rows(tb).pop(); const f = U.$('input,textarea', last); if (f) f.focus();
        onChange && onChange(); return;
      }
      const del = e.target.closest('[data-del]');
      if (del) {
        const tr = del.closest('tr'); const tb = tr.parentElement;
        if (U.rows(tb).length > 1) tr.remove();
        else U.$$('input,textarea', tr).forEach((x) => { x.value = ''; });
        onChange && onChange();
      }
    });
  };

  /* ---------- Textareas que crecen con el contenido ---------- */
  U.autosize = (root) => {
    U.$$('textarea', root || document).forEach((t) => {
      if (t.offsetParent === null && !t.closest('template')) return;
      t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px';
    });
  };
  document.addEventListener('input', (e) => {
    if (e.target.tagName === 'TEXTAREA') { e.target.style.height = 'auto'; e.target.style.height = (e.target.scrollHeight + 2) + 'px'; }
    const f = e.target.closest && (e.target.closest('.field') || e.target);
    if (f) f.classList.remove('invalid');
  });
  window.addEventListener('beforeprint', () => U.autosize());

  /* ---------- Validación ---------- */
  U.validate = (form, extra) => {
    U.$$('.invalid', form).forEach((e) => e.classList.remove('invalid'));
    let first = null;
    const mark = (el) => { (el.closest('.field') || el).classList.add('invalid'); first = first || el; };
    const seen = new Set();
    U.$$('[required]', form).forEach((el) => {
      if (el.disabled || el.closest('[hidden]')) return;
      if (el.type === 'radio') {
        if (seen.has(el.name)) return; seen.add(el.name);
        if (!form.querySelector(`input[name="${CSS.escape(el.name)}"]:checked`)) mark(el);
        return;
      }
      if (!el.value.trim() || !el.checkValidity()) mark(el);
    });
    (extra ? extra() : []).forEach(mark);
    if (first) {
      first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (first.type !== 'radio' && first.type !== 'checkbox') first.focus({ preventScroll: true });
      U.toast('Revisa los campos marcados en rojo', 'error');
      return false;
    }
    return true;
  };

  /* ---------- Código de documento sugerido ---------- */
  U.nextCode = (prefix, tipo) => {
    const n = U.list().filter((r) => r.tipo === tipo).length + 1;
    return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(3, '0')}`;
  };
})();
