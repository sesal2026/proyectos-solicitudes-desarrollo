(function () {
  'use strict';
  
  const appContainer = document.querySelector('#app');
  const errBox = document.querySelector('#err') || document.querySelector('.form-err');

  async function cargarSolicitudes() {
    if (!appContainer) return;

    // Mostrar un estado de carga inicial dentro de la vista
    appContainer.innerHTML = `
      <div class="page-header">
        <h1>Solicitudes de Requerimiento</h1>
        <p>Cargando información desde la base de datos...</p>
      </div>
    `;

    try {
      const response = await fetch('obtener_solicitudes.php');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'No se pudieron cargar las solicitudes.');
      }

      const solicitudes = result.data || [];

      // Construir la estructura completa de la página con su tabla
      appContainer.innerHTML = `
        <div class="page-header">
          <h1>Solicitudes de Requerimiento</h1>
          <p>Listado general registrado en la base de datos MySQL.</p>
        </div>
        <div class="table-container">
          <table id="tabla-solicitudes" class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Título / Sistema</th>
                <th>Solicitante</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Fecha de Creación</th>
              </tr>
            </thead>
            <tbody>
              ${solicitudes.length === 0 ? '<tr><td colspan="6" style="text-align: center; padding: 20px;">No hay solicitudes registradas en la base de datos.</td></tr>' : ''}
              ${solicitudes.map((req, index) => `
                <tr>
                  <td>#${index + 1}</td>
                  <td><strong>${escapeHtml(req.titulo)}</strong></td>
                  <td>${escapeHtml(req.solicitante)}</td>
                  <td><span class="badge">${escapeHtml(req.prioridad)}</span></td>
                  <td><span class="badge">${escapeHtml(req.estado)}</span></td>
                  <td>${escapeHtml(req.fecha_creacion)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

    } catch (ex) {
      if (errBox) {
        errBox.textContent = ex.message;
        errBox.hidden = false;
      } else {
        appContainer.innerHTML = `
          <div class="page-header">
            <h1>Solicitudes de Requerimiento</h1>
            <p style="color: red;">Error: ${escapeHtml(ex.message)}</p>
          </div>
        `;
      }
    }
  }

  // Función auxiliar para evitar inyecciones de código HTML (XSS)
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Ejecutar la carga de datos al abrir la página
  document.addEventListener('DOMContentLoaded', cargarSolicitudes);
})();