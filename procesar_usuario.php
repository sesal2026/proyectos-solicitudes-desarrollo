<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once 'conexion.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No hay una sesión activa.']);
    exit;
}

$accion = $_POST['accion'] ?? $_GET['accion'] ?? '';

try {
    if ($accion === 'listar') {
        $stmt = $pdo->query("SELECT id, nombre, email, rol, creado FROM usuarios ORDER BY creado DESC");
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'usuarios' => $usuarios]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $nombre = trim($_POST['nombre'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $rol = trim($_POST['rol'] ?? 'Usuario');

        if (empty($nombre) || empty($email)) {
            throw new Exception('El nombre y el correo electrónico son obligatorios.');
        }

        $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, email, rol, creado) VALUES (?, ?, ?, NOW())");
        $stmt->execute([$nombre, $email, $rol]);

        echo json_encode([
            'success' => true,
            'message' => '¡Usuario registrado correctamente en el servidor!'
        ]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Acción no válida.']);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>