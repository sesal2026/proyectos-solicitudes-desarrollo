(function () {
  'use strict';
  const U = window.UGI, $ = U.$, $$ = U.$$;

  async function actualizarEtapa(id, nuevaEtapa) {
    try {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('etapa', nuevaEtapa);

      const response = await fetch('procesar_etapa.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error al actualizar la etapa.');
      }

      U.toast(result.message || 'Etapa actualizada correctamente', 'ok');
    } catch (ex) {
      alert('Error: ' + ex.message);
    }
  }

  // Exponer la función globalmente si el flujo de etapas lo requiere
  window.UGI_Etapas = { actualizarEtapa };

  // Inicialización de la vista de etapas
  function initEtapas() {
    const contenedor = $('#app') || document.querySelector('main');
    if (!contenedor) return;

    // Aquí puedes mantener la lógica visual de etapas que ya poseía el script original,
    // asegurando que al cambiar de etapa se invoque a actualizarEtapa(id, etapa).
  }

  document.addEventListener('DOMContentLoaded', initEtapas);
})();
