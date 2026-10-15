<?php
// Indicamos que la respuesta será en formato JSON
header('Content-Type: application/json; charset=utf-8');

// Incluimos la conexión y la clase Auth
require_once 'auth.php';

// Verificamos que los datos se hayan enviado por método POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $rol = $_POST['role'] ?? ''; // El rol que seleccionó el usuario en el formulario

    try {
        // Intentamos hacer el login utilizando el método de la clase Auth
        $usuario = $auth->login($email, $password, $rol);

        // Si es exitoso, devolvemos una respuesta JSON positiva con el rol correspondiente
        echo json_encode([
            'success' => true,
            'role' => $usuario['rol_nombre'] ?? $rol
        ]);
        exit;

    } catch (Exception $e) {
        // Si hay un error, devolvemos el mensaje en JSON para que JavaScript lo muestre en pantalla
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
        exit;
    }
} else {
    // Si intentan entrar directamente al archivo por la URL
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
    exit;
}
?>