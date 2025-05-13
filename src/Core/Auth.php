<?php
require_once __DIR__ . '/../Config/AppConfig.php';
require_once __DIR__ . '/../Config/Database.php';

class Auth {
    private $conn;
    private $db_table = "users";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->startSecureSession();
    }

    private function startSecureSession() {
        if (session_status() == PHP_SESSION_NONE) {
            session_name(SESSION_NAME);
            session_set_cookie_params([
                'lifetime' => SESSION_TIMEOUT_SECONDS,
                'path' => '/',
                'domain' => '', // Deixe em branco para localhost ou defina seu domínio
                'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on', // True se HTTPS
                'httponly' => true,
                'samesite' => 'Lax'
            ]);
            session_start();
        }
        // Regenerar ID da sessão periodicamente para maior segurança (opcional)
        // if (empty($_SESSION['last_session_regenerate'])) {
        //     $_SESSION['last_session_regenerate'] = time();
        // } else if (time() - $_SESSION['last_session_regenerate'] > (SESSION_TIMEOUT_SECONDS / 2)) {
        //     session_regenerate_id(true);
        //     $_SESSION['last_session_regenerate'] = time();
        // }
    }


    public function register($name, $email, $password) {
        // Validação (pode ser expandida com uma classe Validator)
        if (empty($name) || empty($email) || empty($password)) {
            return "Todos os campos são obrigatórios.";
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return "Formato de email inválido.";
        }
        if (strlen($password) < 6) { // Exemplo de regra de senha
            return "A senha deve ter pelo menos 6 caracteres.";
        }

        // Verificar se email já existe
        $query = "SELECT id FROM " . $this->db_table . " WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        if ($stmt->rowCount() > 0) {
            return "Este email já está registrado.";
        }

        $password_hash = password_hash($password, PASSWORD_BCRYPT);
        $query = "INSERT INTO " . $this->db_table . " (name, email, password_hash) VALUES (:name, :email, :password_hash)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password_hash', $password_hash);

        try {
            if ($stmt->execute()) {
                return true;
            }
        } catch (PDOException $e) {
            // Logar $e->getMessage() em produção
            return "Erro no banco de dados ao registrar. Tente novamente.";
        }
        return "Erro desconhecido ao registrar. Tente novamente.";
    }

    public function login($email, $password) {
        if (empty($email) || empty($password)) {
            return "Email e senha são obrigatórios.";
        }

        $query = "SELECT id, name, email, password_hash FROM " . $this->db_table . " WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if ($stmt->rowCount() == 1) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if (password_verify($password, $user['password_hash'])) {
                session_regenerate_id(true); // Prevenir session fixation
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['name'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['login_time'] = time(); // Para controle de timeout
                return true;
            }
        }
        return "Email ou senha incorretos.";
    }

    public function isLoggedIn() {
        if (isset($_SESSION['user_id'])) {
            // Verificar timeout da sessão
            if (isset($_SESSION['login_time']) && (time() - $_SESSION['login_time'] > SESSION_TIMEOUT_SECONDS)) {
                $this->logoutWithMessage("Sua sessão expirou. Faça login novamente.");
                return false;
            }
            // Atualizar o tempo de login para estender a sessão
            $_SESSION['login_time'] = time();
            return true;
        }
        return false;
    }

    public function logout() {
        session_unset(); // Remove todas as variáveis de sessão
        session_destroy(); // Destrói a sessão
        $this->startSecureSession(); // Inicia uma nova sessão limpa para mensagens flash, se necessário
        header("Location: " . BASE_URL . "/login.php");
        exit;
    }
    
    public function logoutWithMessage($message) {
        session_unset();
        session_destroy();
        $this->startSecureSession();
        $_SESSION['info_message'] = $message; // Usar para exibir mensagem na página de login
        header("Location: " . BASE_URL . "/login.php");
        exit;
    }


    public function getUserId() {
        return $_SESSION['user_id'] ?? null;
    }
    
    public function getUserName() {
        return $_SESSION['user_name'] ?? null;
    }

    // Funções de criptografia/descriptografia para API Key
    // Usam ENCRYPTION_KEY e ENCRYPTION_CIPHER de AppConfig.php
    public static function encryptApiKey($apiKey) {
        if (empty($apiKey)) return null;
        $ivlen = openssl_cipher_iv_length(ENCRYPTION_CIPHER);
        $iv = openssl_random_pseudo_bytes($ivlen);
        $ciphertext_raw = openssl_encrypt($apiKey, ENCRYPTION_CIPHER, ENCRYPTION_KEY, OPENSSL_RAW_DATA, $iv);
        if ($ciphertext_raw === false) {
            // log openssl_error_string()
            return null;
        }
        $hmac = hash_hmac('sha256', $ciphertext_raw, ENCRYPTION_KEY, true);
        return base64_encode($iv . $hmac . $ciphertext_raw);
    }

    public static function decryptApiKey($encryptedApiKey) {
        if (empty($encryptedApiKey)) return null;
        
        $c = base64_decode($encryptedApiKey);
        if ($c === false) return null;

        $ivlen = openssl_cipher_iv_length(ENCRYPTION_CIPHER);
        if (strlen($c) < $ivlen + 32) { // IV + HMAC (SHA256 = 32 bytes)
            return null; // Dados criptografados muito curtos
        }

        $iv = substr($c, 0, $ivlen);
        $hmac = substr($c, $ivlen, 32); // sha256 hmac é 32 bytes
        $ciphertext_raw = substr($c, $ivlen + 32);

        if ($ciphertext_raw === false || $ciphertext_raw === '') return null;

        $original_plaintext = openssl_decrypt($ciphertext_raw, ENCRYPTION_CIPHER, ENCRYPTION_KEY, OPENSSL_RAW_DATA, $iv);
        
        if ($original_plaintext === false) {
            // log openssl_error_string()
            return null;
        }

        $calcmac = hash_hmac('sha256', $ciphertext_raw, ENCRYPTION_KEY, true);

        if (hash_equals($hmac, $calcmac)) { // Compara em tempo constante
            return $original_plaintext;
        }
        
        return null; // Falha na descriptografia ou HMAC inválido
    }
    
    // Proteção CSRF (Básica)
    public static function generateCsrfToken() {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function verifyCsrfToken($token) {
        if (isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token)) {
            // Token é válido, pode ser uma boa ideia invalidá-lo após o uso para single-use tokens
            // unset($_SESSION['csrf_token']); // Descomente para single-use tokens
            return true;
        }
        return false;
    }

    // Helper para redirecionar para login se não estiver logado
    public function requireLogin() {
        if (!$this->isLoggedIn()) {
            $_SESSION['error_message'] = "Você precisa estar logado para acessar esta página.";
            header("Location: " . BASE_URL . "/login.php");
            exit;
        }
    }
}
?> 
