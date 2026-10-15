<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once 'conexion.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No hay una sesión activa.']);
    exit;
}

try {
    // Obtener contadores reales desde las tablas de la base de datos MySQL
    $stmtCambios = $pdo->query("SELECT COUNT(*) FROM cambios");
    $totalCambios = $stmtCambios->fetchColumn();

    $stmtRequerimientos = $pdo->query("SELECT COUNT(*) FROM requerimientos");
    $totalRequerimientos = $stmtRequerimientos->fetchColumn();

    $stmtUsuarios = $pdo->query("SELECT COUNT(*) FROM usuarios");
    $totalUsuarios = $stmtUsuarios->fetchColumn();

    echo json_encode([
        'success' => true,
        'stats' => [
            'cambios' => (int)$totalCambios,
            'requerimientos' => (int)$totalRequerimientos,
            'usuarios' => (int)$totalUsuarios
        ]
    ]);
    exit;

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>