<?php
session_start();
require_once 'conexion.php'; // Incluye la conexión PDO que ya configuraste

class Auth {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    // Obtener todos los usuarios (para el panel de administración)
    public function getUsers() {
        $stmt = $this->pdo->query("SELECT u.id, u.nombre, u.email, u.estado, r.nombre as rol FROM usuarios u JOIN roles r ON u.rol_id = r.id");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Iniciar sesión
    public function login($email, $password, $rolEsperado) {
        $stmt = $this->pdo->prepare("SELECT u.*, r.nombre as rol_nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.email = ?");
        $stmt->execute([trim(strtolower($email))]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password'])) {
            if ($user['estado'] !== 'activo') {
                throw new Exception('Tu cuenta está desactivada. Contacta al administrador.');
            }
            
            // Validar rol si es necesario
            if (strcasecmp($user['rol_nombre'], $rolEsperado) !== 0) {
                throw new Exception('Rol incorrecto para este usuario.');
            }

            // Registrar sesión
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['nombre'];
            $_SESSION['user_role'] = $user['rol_nombre'];
            $_SESSION['time'] = time();

            return $user;
        }

        throw new Exception('Correo, contraseña o rol incorrectos.');
    }

    // Verificar si hay una sesión activa
    public function current() {
        if (!isset($_SESSION['user_id'])) {
            return null;
        }
        // Opcional: Validar tiempo de expiración (8 horas)
        if (isset($_SESSION['time']) && (time() - $_SESSION['time'] > 28800)) {
            $this->logout();
            return null;
        }
        return [
            'id' => $_SESSION['user_id'],
            'name' => $_SESSION['user_name'],
            'role' => $_SESSION['user_role']
        ];
    }

    // Cerrar sesión
    public function logout() {
        session_unset();
        session_destroy();
        header('Location: login.html');
        exit;
    }

    // Cambiar contraseña
    public function changePassword($userId, $currentPassword, $newPassword) {
        $stmt = $this->pdo->prepare("SELECT password FROM usuarios WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($currentPassword, $user['password'])) {
            throw new Exception('La contraseña actual no es correcta.');
        }

        if (strlen($newPassword) < 8) {
            throw new Exception('La nueva contraseña debe tener al menos 8 caracteres.');
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $update = $this->pdo->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
        return $update->execute([$newHash, $userId]);
    }
}

// Instancia global para usar en otros scripts PHP
$auth = new Auth($pdo);
?>