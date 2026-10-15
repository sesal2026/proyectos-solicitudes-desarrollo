(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);

  /* Si ya hay sesión activa en PHP, se podría manejar desde el servidor, 
     pero mantenemos la estructura segura */

  /* Solo se acepta como destino un archivo .html del mismo directorio */
  const safeNext = () => {
    const n = params.get('next') || '';
    return /^[\w-]+\.html(\?[\w=&%.-]*)?$/.test(n) ? n : '';
  };
  
  const enter = (role) => {
    const next = safeNext();
    const defaultHomes = {
      'Administrador': 'panel.html',
      'Desarrollador': 'solicitudes.html',
      'Supervisor': 'etapas.html',
      'Usuario': 'index.html'
    };
    location.replace(next || defaultHomes[role] || 'panel.html');
  };

  /* ---------- Selector de rol ---------- */
  const roles = $('#roles'), hint = $('#role-hint'), submit = $('#submit');
  const ROLE_KEYS = ['Administrador', 'Desarrollador', 'Supervisor', 'Usuario'];
  
  const ROLE_DATA = {
    Administrador: { label: 'Administrador', icon: 'shield' },
    Desarrollador: { label: 'Desarrollador', icon: 'code' },
    Supervisor: { label: 'Supervisor', icon: 'activity' },
    Usuario: { label: 'Usuario', icon: 'user' }
  };

  ROLE_KEYS.forEach((k) => {
    const r = ROLE_DATA[k];
    roles.insertAdjacentHTML('beforeend', `
      <label class="role-tile"><input type="radio" name="role" value="${k}" ${k === 'Usuario' ? 'checked' : ''}>
        <span>${k}</span></label>`);
  });

  const HINTS = {
    Administrador: 'Acceso total a la página y gestión de usuarios. Solo personal autorizado.',
    Desarrollador: 'Consulta de las solicitudes registradas. Solo personal autorizado.',
    Supervisor: 'Seguimiento de la etapa en la que se encuentra cada desarrollo. Solo personal autorizado.',
    Usuario: 'Acceso a los formatos de Solicitud de Requerimiento y Solicitud de Cambios.',
  };

  const role = () => (document.querySelector('input[name="role"]:checked') || {}).value;
  
  function sync() {
    const r = role();
    hint.textContent = HINTS[r];
    submit.textContent = 'Ingresar como ' + r;
    const regLink = $('#reg-link');
    if (regLink) regLink.hidden = r !== 'Usuario';
    $('#err').hidden = true;
  }
  
  roles.addEventListener('change', sync); 
  sync();

  $('#toggle').addEventListener('click', () => {
    const pw = $('#pw'), show = pw.type === 'password';
    pw.type = show ? 'text' : 'password'; 
    $('#toggle').textContent = show ? 'Ocultar' : 'Ver';
  });

  /* ---------- Envío del Login a PHP ---------- */
  $('#f-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#err'); 
    err.hidden = true;
    
    const email = $('#email').value.trim();
    const pw = $('#pw').value;
    const selectedRole = role();

    if (!email || !pw) { 
      err.textContent = 'Ingresa tu correo y contraseña'; 
      err.hidden = false; 
      return; 
    }

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', pw);
      formData.append('role', selectedRole);

      // Petición asíncrona a tu script de PHP en Apache
      const response = await fetch('procesar_login.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        enter(result.role);
      } else {
        throw new Error(result.message || 'Error al iniciar sesión');
      }

    } catch (ex) { 
      err.textContent = ex.message; 
      err.hidden = false; 
      $('#pw').value = ''; 
      $('#pw').focus(); 
    }
  });
})();