<?php
$host = 'localhost';
$db   = 'ugi_proyecto_db'; // Cambia esto por el nombre de tu base de datos
$user = 'root'; // Cambia esto por tu usuario de MySQL
$pass = 'sesal2026'; // Cambia esto por tu contraseña

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO.ATTR_ERRMODE, PDO.ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión: ' . $e->getMessage()]);
    exit;
}
?>