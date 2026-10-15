(function () {
  'use strict';
  const U = window.UGI, $ = U.$;

  async function cargarEstadisticasPanel() {
    try {
      const response = await fetch('obtener_panel.php');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error al obtener las métricas del panel.');
      }

      const stats = result.stats;

      // Actualizar los elementos visuales del panel si existen en el HTML
      const elCambios = $('#stat-cambios');
      if (elCambios) elCambios.textContent = stats.cambios;

      const elRequerimientos = $('#stat-requerimientos');
      if (elRequerimientos) elRequerimientos.textContent = stats.requerimientos;

      const elUsuarios = $('#stat-usuarios');
      if (elUsuarios) elUsuarios.textContent = stats.usuarios;

    } catch (ex) {
      console.error('Error cargando estadísticas del panel:', ex.message);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    cargarEstadisticasPanel();
  });
})();