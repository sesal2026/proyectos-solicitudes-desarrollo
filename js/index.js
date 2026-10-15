(function () {
  'use strict';
  const U = window.UGI, $ = U.$;
  const tbody = $('#hist tbody');
  const PAGE = { cambios: 'cambios.html', requerimiento: 'requerimiento.html' };
  const NAME = { cambios: 'Cambios en ambientes', requerimiento: 'Requerimiento de cambios' };

  function render() {
    const list = U.visible();
    $('#hist').hidden = !list.length;
    $('#empty').hidden = !!list.length;
    tbody.innerHTML = list.map((r) => `
      <tr data-id="${U.esc(r.id)}">
        <td><span class="badge ${U.esc(r.tipo)}">${U.esc(NAME[r.tipo] || r.tipo)}</span></td>
        <td>${U.esc(r.codigo)}</td>
        <td>${U.esc(r.titulo)}</td>
        <td>${U.esc(r.solicitante)}</td>
        <td>${U.fmtDate(r.fecha)}</td>
        <td><div class="row-actions">
          <a class="btn ghost sm" href="${PAGE[r.tipo] || '#'}?id=${encodeURIComponent(r.id)}">Abrir</a>
          <button class="btn ghost sm" data-json>JSON</button>
          <button class="btn danger sm" data-del>Eliminar</button>
        </div></td>
      </tr>`).join('');
  }

  tbody.addEventListener('click', (e) => {
    const tr = e.target.closest('tr'); if (!tr) return;
    const rec = U.get(tr.dataset.id); if (!rec) return;
    if (e.target.closest('[data-json]')) {
      U.download((rec.codigo || 'solicitud') + '.json', JSON.stringify({ tipo: rec.tipo, data: rec.data }, null, 2));
    } else if (e.target.closest('[data-del]')) {
      if (confirm(`¿Eliminar la solicitud ${rec.codigo}? Esta acción no se puede deshacer.`)) {
        U.remove(rec.id); U.draftDel(rec.tipo + '_' + rec.id); render(); U.toast('Solicitud eliminada');
      }
    }
  });

  if (Auth.current().role === 'USUARIO') $('#hist-title').textContent = 'Mis solicitudes registradas';
  render();
})();
