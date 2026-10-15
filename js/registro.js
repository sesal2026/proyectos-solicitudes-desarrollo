(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  
  const form = $('#f-register') || document.querySelector('form');
  const errBox = $('#err') || $('#s-err') || document.querySelector('.form-err');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errBox) {
      errBox.hidden = true;
      errBox.textContent = '';
    }

    // Capturar campos del formulario (ajustados según los nombres de los inputs de tu HTML)
    const nameInput = $('#s-name') || $('#name') || form.querySelector('[name="name"]');
    const userInput = $('#s-user') || $('#username') || form.querySelector('[name="username"]');
    const emailInput = $('#s-email') || $('#email') || form.querySelector('[name="email"]');
    const pwInput = $('#s-pw') || $('#pw') || form.querySelector('[name="password"]');
    const pw2Input = $('#s-pw2') || $('#pw2') || form.querySelector('[name="password_confirm"]');

    const name = nameInput ? nameInput.value.trim() : '';
    const username = userInput ? userInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = pwInput ? pwInput.value : '';
    const password_confirm = pw2Input ? pw2Input.value : '';

    try {
      // Validaciones básicas en el cliente
      if (!name || !username || !email || !password) {
        throw new Error('Todos los campos son obligatorios.');
      }

      if (password_confirm && password !== password_confirm) {
        throw new Error('Las contraseñas no coinciden.');
      }

      if (password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres.');
      }

      // Preparar los datos para enviar a procesar_registro.php
      const formData = new FormData();
      formData.append('name', name);
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);

      // Petición al backend en PHP
      const response = await fetch('procesar_registro.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message || '¡Registro exitoso!');
        // Redirigir al login para que el usuario pueda iniciar sesión
        window.location.href = 'login.html';
      } else {
        throw new Error(result.message || 'Error al registrar la cuenta.');
      }

    } catch (ex) {
      if (errBox) {
        errBox.textContent = ex.message;
        errBox.hidden = false;
      } else {
        alert(ex.message);
      }
    }
  });
})();