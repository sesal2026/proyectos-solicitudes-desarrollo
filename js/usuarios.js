(function () {
  'use strict';
  const U = window.UGI, $= U.$, $$= U.$$;

  async function cargarUsuarios() {
    try {
      const response = await fetch('procesar_usuario.php?accion=listar');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error al obtener los usuarios.');
      }

      const tablaUsuarios = $('#tabla-usuarios') || document.querySelector('tbody');
      if (tablaUsuarios && result.usuarios) {
        tablaUsuarios.innerHTML = result.usuarios.map(u => `
          <tr>
            <td>${U.esc(u.nombre)}</td>
            <td>${U.esc(u.email)}</td>
            <td>${U.esc(u.rol)}</td>
            <td>${U.esc(u.creado)}</td>
          </tr>
        `).join('');
      }
    } catch (ex) {
      console.error('Error cargando usuarios:', ex.message);
    }
  }

  const formUsuario = $('#form-usuario') || document.querySelector('form');
  if (formUsuario) {
    formUsuario.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!U.validate(formUsuario)) return;

      const data = U.collect(formUsuario);

      try {
        const formData = new FormData();
        formData.append('nombre', data.nombre || '');
        formData.append('email', data.email || '');
        formData.append('rol', data.rol || 'Usuario');

        const response = await fetch('procesar_usuario.php', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Error al registrar el usuario.');
        }

        U.toast(result.message, 'ok');
        formUsuario.reset();
        cargarUsuarios();

      } catch (ex) {
        alert('Error: ' + ex.message);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    cargarUsuarios();
  });
})();