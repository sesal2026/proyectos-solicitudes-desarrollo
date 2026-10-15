<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once 'conexion.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No hay una sesión activa.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = trim($_POST['id'] ?? '');
    $etapa = trim($_POST['etapa'] ?? '');

    try {
        if (empty($id) || empty($etapa)) {
            throw new Exception('El identificador y la nueva etapa son obligatorios.');
        }

        // Actualizar el estado/etapa en la base de datos (puedes ajustar la tabla según tu esquema, ej. requerimientos o cambios)
        $stmt = $pdo->prepare("UPDATE requerimientos SET estado = ? WHERE id = ?");
        $stmt->execute([$etapa, $id]);

        echo json_encode([
            'success' => true,
            'message' => '¡Etapa actualizada con éxito en el servidor!'
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