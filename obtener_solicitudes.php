<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once 'conexion.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

try {
    // Consultamos los requerimientos y el nombre del usuario que los creó
    $stmt = $pdo->query("
        SELECT r.id, r.titulo, r.descripcion, r.prioridad, r.estado, r.fecha_creacion, u.nombre as solicitante 
        FROM requerimientos r 
        JOIN usuarios u ON r.usuario_id = u.id 
        ORDER BY r.fecha_creacion DESC
    ");
    $requerimientos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $requerimientos
    ]);
    exit;

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    exit;
}
?>