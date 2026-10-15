<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once 'conexion.php';

// Verificar si el usuario ha iniciado sesión
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'No hay una sesión activa. Por favor, inicia sesión.'
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $usuario_id = $_SESSION['user_id'];
    $titulo = trim($_POST['titulo'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');
    $prioridad = trim($_POST['prioridad'] ?? 'Media');

    try {
        if (empty($titulo) || empty($descripcion)) {
            throw new Exception('El título y la descripción del requerimiento son obligatorios.');
        }

        // Insertar el requerimiento en la base de datos
        $stmt = $pdo->prepare("INSERT INTO requerimientos (usuario_id, titulo, descripcion, prioridad, estado) VALUES (?, ?, ?, ?, 'Nuevo')");
        $stmt->execute([$usuario_id, $titulo, $descripcion, $prioridad]);

        echo json_encode([
            'success' => true,
            'message' => '¡Requerimiento enviado con éxito!'
        ]);
        exit;

    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
        exit;
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
    exit;
}
?>