<?php
// Indicamos que la respuesta será en formato JSON
header('Content-Type: application/json; charset=utf-8');

// Incluimos la conexión PDO
require_once 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Recogemos los datos enviados desde el formulario de registro
    $nombre = trim($_POST['name'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $email = trim(strtolower($_POST['email'] ?? ''));
    $password = $_POST['password'] ?? '';
    // Por defecto, los registros públicos suelen tener el rol de 'Usuario' (rol_id = 4 o el que corresponda)
    // O puedes buscar el id del rol 'Usuario' dinámicamente:
    $rol_nombre = 'Usuario'; 

    try {
        // Validaciones básicas
        if (empty($nombre) || empty($username) || empty($email) || empty($password)) {
            throw new Exception('Todos los campos son obligatorios.');
        }

        if (strlen($password) < 8) {
            throw new Exception('La contraseña debe tener al menos 8 caracteres.');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('El correo electrónico no es válido.');
        }

        // 1. Verificar si el correo o usuario ya existen
        $stmtCheck = $pdo->prepare("SELECT id FROM usuarios WHERE email = ? OR nombre = ?");
        $stmtCheck->execute([$email, $username]);
        if ($stmtCheck->rowCount() > 0) {
            throw new Exception('El correo electrónico o el nombre de usuario ya están registrados.');
        }

        // 2. Obtener el ID del rol 'Usuario' por defecto
        $stmtRol = $pdo->prepare("SELECT id FROM roles WHERE nombre = ?");
        $stmtRol->execute([$rol_nombre]);
        $rolData = $stmtRol->fetch(PDO::FETCH_ASSOC);
        
        if (!$rolData) {
            throw new Exception('No se encontró el rol de usuario predeterminado en la base de datos.');
        }
        $rol_id = $rolData['id'];

        // 3. Encriptar la contraseña de forma segura con BCRYPT
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        // 4. Insertar el nuevo usuario en la base de datos
        $stmtInsert = $pdo->prepare("INSERT INTO usuarios (nombre, email, password, rol_id, estado) VALUES (?, ?, ?, ?, 'activo')");
        $stmtInsert->execute([$nombre, $email, $passwordHash, $rol_id]);

        echo json_encode([
            'success' => true,
            'message' => '¡Cuenta creada con éxito! Ya puedes iniciar sesión.'
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