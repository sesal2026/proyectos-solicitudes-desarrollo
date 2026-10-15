(function () {
  'use strict';
  const U = window.UGI, $= U.$, $$= U.$$;
  const form = $('#f');
  const params = new URLSearchParams(location.search);
  let recId = params.get('id') || null;
  const draftKey = () => 'cambios' + (recId ? '_' + recId : '');

  /* ---------- UI condicional ---------- */
  function sync() {
    const emer = form.clasificacion && form.clasificacion.value === 'Emergencia';
    const emergBox = $('#emerg-box'); if (emergBox) { emergBox.hidden = !emer; const textarea = emergBox.querySelector('textarea'); if (textarea) textarea.required = emer; }      const infra = $$('input[name="tipo[]"]').some((c) => c.checked && c.value === 'Infraestructura');
    const subtipoBox = $('#subtipo-box');
    if (subtipoBox) {
      subtipoBox.hidden = !infra;
      if (!infra) {
        $$('input[name="subtipo[]"]').forEach((c) => { c.checked = false; }); } } U.autosize(form); } if (form) form.addEventListener('change', sync);    /* ---------- Carga de datos ---------- */ function load(data) { $$
('tbody[data-dyn]').forEach((tb) => {
      const template = $('template', tb);
      if (template) {
        const firstInput = $('[name]', template.content);
        if (firstInput) {
          const firstKey = firstInput.name.replace('[]', '');
          U.setRows(tb, Math.max(3, (data && data[firstKey] || []).length));
        }
      }
    });
    U.fill(form, data || {});
    if (form) {
      if (!data || !data.fecha_solicitud) form.fecha_solicitud.value = U.today();
      if (!data || !data.codigo) form.codigo.value = U.nextCode('SCA', 'cambios');
    }
    sync();
  }

  function init() {
    const draft = U.draftGet(draftKey());
    const rec = recId && U.get(recId);
    if (rec && window.Auth && !Auth.canOpen(rec)) { 
      location.replace(Auth.ROLES[Auth.current().role].home); 
      return; 
    }
    if (draft && draft.data) { 
      load(draft.data); 
      U.toast('Se recuperó tu borrador'); 
    } else if (rec) {
      load(rec.data);
    } else {
      load(null);
    }
  }

  /* ---------- Autoguardado de borrador ---------- */
  const saveDraft = U.debounce(() => {
    if (U.draftSet(draftKey(), { data: U.collect(form), at: Date.now() })) {
      const d = new Date();
      const statusEl = $('#status'); if (statusEl) { statusEl.textContent = 'Borrador guardado ' + d.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' }); } } }, 500);    if (form) { form.addEventListener('input', saveDraft); form.addEventListener('change', saveDraft); U.initDynTables(form, saveDraft); }    /* ---------- Validación específica ---------- */ function extra() { const bad = []; const tipos = $$('input[name="tipo[]"]');
    if (tipos.length && !tipos.some((c) => c.checked)) {
      bad.push(tipos[0]);
    }
    
    const subtipoBox = $('#subtipo-box'); const subtipos = $$('input[name="subtipo[]"]');
    if (subtipoBox && !subtipoBox.hidden && subtipos.length && !subtipos.some((c) => c.checked)) {
      bad.push(subtipos[0]);
    }

    const tProc = $('#t-proc');
    if (tProc) {
      const rows = U.rows(tProc);
      if (rows && rows.length) {
        const filled = rows.filter((r) => {
          const ta = $('textarea', r);
          const inp = $('input', r);
          return (ta && ta.value.trim()) || (inp && inp.value.trim());
        });
        if (!filled.length && rows[0]) {
          const ta = $('textarea', rows[0]);
          if (ta) bad.push(ta);
        }
      }
    }
    return bad;
  }

  /* ---------- Acciones de Botones ---------- */
  const bPrint = $('#b-print');
  const bPrint2 = $('#b-print2');
  if (bPrint) bPrint.addEventListener('click', printForm);
  if (bPrint2) bPrint2.addEventListener('click', printForm);

  function printForm() {
    const old = document.title;
    document.title = (form.codigo.value || 'Solicitud de cambios').replace(/[^\w.-]+/g, '_');
    U.autosize(form); 
    window.print(); 
    document.title = old;
  }

  const bJson = $('#b-json');
  if (bJson) {
    bJson.addEventListener('click', () => {
      const d = U.collect(form);
      U.download((d.codigo || 'solicitud-cambios') + '.json', JSON.stringify({ tipo: 'cambios', data: d }, null, 2));
    });
  }

  const bClear = $('#b-clear');
  if (bClear) {
    bClear.addEventListener('click', () => {
      if (!confirm('¿Limpiar todo el formulario? Se perderá lo que no hayas registrado.')) return;
      U.draftDel(draftKey()); 
      recId = null; 
      history.replaceState(null, '', 'cambios.html');
      const doneBox = $('#done');
      if (doneBox) doneBox.hidden = true; 
      load(null); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const bNew = $('#b-new');
  if (bNew) {
    bNew.addEventListener('click', () => {
      U.draftDel(draftKey()); 
      recId = null; 
      history.replaceState(null, '', 'cambios.html');
      const doneBox = $('#done');
      if (doneBox) doneBox.hidden = true; 
      load(null); 
      const statusEl = $('#status');
      if (statusEl) statusEl.textContent = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- ENVÍO OFICIAL AL SERVIDOR (PHP / MYSQL) ---------- */
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!U.validate(form, extra)) return;

      const data = U.collect(form);

      try {
        const formData = new FormData();
        // Campos esenciales que procesa el backend PHP
        formData.append('sistema', data.nombre_cambio || data.sistema || 'Sistema UGI');
        formData.append('descripcion', JSON.stringify(data));
        formData.append('motivo', data.justificacion || data.motivo || 'Sin motivo especificado');

        const response = await fetch('procesar_cambio.php', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Error desconocido en el servidor.');
        }

        // Limpiar borrador local y mostrar confirmación de éxito en servidor
        U.draftDel(draftKey());
        
        const doneMsg = $('#done-msg');
        if (doneMsg) {
          doneMsg.innerHTML = `<strong>${U.esc(data.codigo || 'SCA')}</strong> · ${U.esc(data.nombre_cambio || 'Solicitud')}<br>
            <small>Guardada y sincronizada correctamente con la base de datos MySQL en el servidor.</small>`;
        }
        
        const doneBox = $('#done');
        if (doneBox) {
          doneBox.hidden = false;
          doneBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        U.toast('Solicitud registrada en el servidor', 'ok');

      } catch (ex) {
        alert('Error de conexión con el servidor: ' + ex.message);
      }
    });
  }

  init();
  if (window.Auth && typeof Auth.applyReadonly === 'function') {
    Auth.applyReadonly(form);
  }
})();