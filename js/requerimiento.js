(function () {
  'use strict';
  const U = window.UGI, $= U.$, $$= U.$$;
  const form = $('#f');
  const reqs = $('#reqs'), a1 = $('#a1'), a2 = $('#a2');
  const params = new URLSearchParams(location.search);
  let recId = params.get('id') || null;
  const draftKey = () => 'requerimiento' + (recId ? '_' + recId : '');

  /* ---------- Plantillas de HTML ---------- */
  const reqHTML = `
    <article class="req-block">
      <header>
        <h3>Requerimiento #<span class="n"></span></h3>
        <button type="button" class="btn danger sm no-print" data-delreq>Eliminar</button>
      </header>
      <div class="grid">
        <label class="field req col-12"><span class="lbl">Descripción</span>
          <textarea name="req_desc[]" required placeholder="Descripción detallada del requerimiento a solicitar"></textarea></label>
        <label class="field req col-5"><span class="lbl">Módulo / Sección</span>
          <input type="text" name="req_mod[]" maxlength="150" required placeholder="Ej.: Módulo de Usuarios"></label>
        <label class="field req col-7"><span class="lbl">Ruta o ubicación (URL exacta)</span>
          <input type="url" name="req_ruta[]" required placeholder="http://qa-medic.salud.gob.hn:3030/personal"></label>
        <div class="field col-12"><span class="lbl">Anexos (capturas de pantalla o imágenes de referencia)</span>
          <div class="dz"><input type="file" accept="image/*" multiple aria-label="Adjuntar imágenes"><div class="thumbs"></div></div>
        </div>
      </div>
    </article>`;
  const a1HTML = `
    <tr>
      <td class="rowlabel">Requerimiento #<span class="n"></span></td>
      <td><input type="text" name="ent_resp[]" aria-label="Responsable" placeholder="Desarrollador responsable"></td>
      <td><input type="date" name="ent_fecha[]" aria-label="Fecha tentativa de entrega"></td>
      <td><textarea name="ent_obs[]" aria-label="Observación" placeholder="Observaciones del desarrollador"></textarea></td>
    </tr>`;
  const a2HTML = `
    <tr>
      <td class="rowlabel">Requerimiento #<span class="n"></span></td>
      <td><div class="choices">
        <label class="choice c-ok"><input type="radio" value="Aprobado"><span>Aprobado</span></label>
        <label class="choice c-no"><input type="radio" value="Denegado"><span>Denegado</span></label>
      </div></td>
      <td><textarea name="acc_obs[]" aria-label="Observación"></textarea></td>
    </tr>`;
  const add = (parent, html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); parent.appendChild(t.content); };

  /* ---------- Gestión de requerimientos ---------- */
  function renumber() {
    const blocks = $$('.req-block', reqs), r1 = U.rows(a1), r2 = U.rows(a2);
    blocks.forEach((b, i) => {
      $('.n', b).textContent = i + 1;
      $('[data-delreq]', b).hidden = blocks.length === 1;
      $('.n', r1[i]).textContent = i + 1;
      $('.n', r2[i]).textContent = i + 1;
      $$('input[type=radio]', r2[i]).forEach((r) => { r.name = 'res_' + (i + 1); }); }); } function setCount(n) { while ($$
('.req-block', reqs).length < n) { add(reqs, reqHTML); add(a1, a1HTML); add(a2, a2HTML); }
    while ($$('.req-block', reqs).length > n) {$$('.req-block', reqs).pop().remove(); U.rows(a1).pop().remove(); U.rows(a2).pop().remove();
    }
    renumber();
  }

  $('#b-addreq').addEventListener('click', () => {
    setCount($$('.req-block', reqs).length + 1); const last = $$('.req-block', reqs).pop(); $('textarea', last).focus(); saveDraft(); });    reqs.addEventListener('click', (e) => { const del = e.target.closest('[data-delreq]'); if (del) { const blocks = $$('.req-block', reqs); const i = blocks.indexOf(del.closest('.req-block'));
      if (blocks.length === 1) return;
      if (!confirm(`¿Eliminar el requerimiento #${i + 1}?`)) return;
      $$('img', blocks[i]).forEach((im) => URL.revokeObjectURL(im.src));
      blocks[i].remove(); U.rows(a1)[i].remove(); U.rows(a2)[i].remove();
      renumber(); saveDraft(); return;
    }
    const rm = e.target.closest('.thumb button');
    if (rm) { const t = rm.closest('.thumb'); URL.revokeObjectURL($('img', t).src); t.remove(); }
  });

  /* Vista previa de imágenes adjuntas */
  reqs.addEventListener('change', (e) => {
    if (e.target.type !== 'file') return;
    const box = $('.thumbs', e.target.closest('.dz'));
    Array.from(e.target.files).forEach((f) => {
      if (!f.type.startsWith('image/')) { U.toast('Solo se admiten imágenes: ' + f.name, 'error'); return; }
      if (f.size > 8 * 1024 * 1024) { U.toast(f.name + ' supera los 8 MB', 'error'); return; }
      const d = document.createElement('div'); d.className = 'thumb';
      d.innerHTML = `<img alt=""><small></small><button type="button" aria-label="Quitar imagen">×</button>`;
      $('img', d).src = URL.createObjectURL(f);$('img', d).alt = f.name; $('small', d).textContent = f.name; box.appendChild(d); }); e.target.value = ''; });    /* ---------- Carga ---------- */ function load(data) { $$('img', reqs).forEach((im) => URL.revokeObjectURL(im.src));
    reqs.innerHTML = a1.innerHTML = a2.innerHTML = '';
    setCount(Math.max(1, data && data.req_desc ? data.req_desc.length : 1));
    U.fill(form, data || {});
    if (!data || !data.fecha) form.fecha.value = U.today();
    U.autosize(form);
  }
  function init() {
    const draft = U.draftGet(draftKey());
    if (draft && draft.data) { load(draft.data); U.toast('Se recuperó tu borrador'); }
    else load(null);
  }

  /* ---------- Borrador local ---------- */
  const saveDraft = U.debounce(() => {
    if (U.draftSet(draftKey(), { data: U.collect(form), at: Date.now() })) {
      $('#status').textContent = 'Borrador guardado ' + new Date().toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
    }
  }, 500);
  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);

  /* ---------- Acciones ---------- */
  const doPrint = () => {
    const old = document.title; document.title = 'Solicitud_de_requerimiento';
    U.autosize(form); window.print(); document.title = old;
  };
  $('#b-print').addEventListener('click', doPrint);
  $('#b-print2').addEventListener('click', doPrint);

  $('#b-json').addEventListener('click', () => {
    U.download('solicitud-requerimiento.json', JSON.stringify({ tipo: 'requerimiento', data: U.collect(form) }, null, 2));
  });

  function reset() {
    U.draftDel(draftKey()); recId = null; history.replaceState(null, '', 'requerimiento.html');
    $('#done').hidden = true; $('#status').textContent = ''; load(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $('#b-clear').addEventListener('click', () => {
    if (confirm('¿Limpiar todo el formulario? Se perderá lo que no hayas registrado.')) reset();
  });
  $('#b-new').addEventListener('click', reset);

  /* ---------- ENVÍO DE DATOS A MYSQL MEDIANTE PHP ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!U.validate(form)) return;

    const data = U.collect(form);

    try {
      const formData = new FormData();
      formData.append('titulo', data.sistema || 'Requerimiento General');
      formData.append('descripcion', JSON.stringify(data.req_desc || []));
      formData.append('prioridad', 'Media');

      const response = await fetch('procesar_requerimiento.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        U.draftDel(draftKey());
        $('#done-msg').innerHTML = `<strong>${U.esc(result.codigo || 'SRC')}</strong> · ${U.esc(data.sistema)}<br>
          <small>Guardado correctamente en la base de datos de MySQL.</small>`;
        $('#done').hidden = false; 
        $('#done').scrollIntoView({ behavior: 'smooth', block: 'center' });
        U.toast('Solicitud registrada en MySQL', 'ok');
      } else {
        throw new Error(result.message || 'Error al guardar en el servidor.');
      }
    } catch (ex) {
      alert('Error: ' + ex.message);
    }
  });

  init();
})();