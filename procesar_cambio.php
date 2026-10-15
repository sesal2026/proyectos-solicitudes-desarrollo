<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once 'conexion.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No hay una sesión activa.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $usuario_id = $_SESSION['user_id'];
    $sistema = trim($_POST['sistema'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');
    $motivo = trim($_POST['motivo'] ?? '');

    try {
        if (empty($sistema) || empty($descripcion)) {
            throw new Exception('El sistema y la descripción del cambio son obligatorios.');
        }

        // Suponiendo que tienes una tabla para cambios o reutilizamos una estructura de solicitudes
        $stmt = $pdo->prepare("INSERT INTO cambios (usuario_id, sistema, descripcion, motivo, estado) VALUES (?, ?, ?, ?, 'Pendiente')");
        $stmt->execute([$usuario_id, $sistema, $descripcion, $motivo]);

        echo json_encode([
            'success' => true,
            'message' => '¡Solicitud de cambio registrada con éxito!'
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
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}
?>