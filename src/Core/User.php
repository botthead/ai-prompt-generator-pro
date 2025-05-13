<?php
require_once __DIR__ . '/../Config/Database.php';
require_once __DIR__ . '/Auth.php'; // Para usar os métodos de criptografia Auth::encryptApiKey

class User {
    private $conn;
    private $db_table = "users";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getById($id) {
        $query = "SELECT id, name, email, api_key_encrypted FROM " . $this->db_table . " WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateProfile($id, $name, $email) {
        // Validação
        if (empty($name) || empty($email)) {
            return "Nome e email são obrigatórios.";
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return "Formato de email inválido.";
        }

        // Verificar se o novo email já existe para outro usuário
        $queryCheckEmail = "SELECT id FROM " . $this->db_table . " WHERE email = :email AND id != :id LIMIT 1";
        $stmtCheckEmail = $this->conn->prepare($queryCheckEmail);
        $stmtCheckEmail->bindParam(':email', $email);
        $stmtCheckEmail->bindParam(':id', $id, PDO::PARAM_INT);
        $stmtCheckEmail->execute();
        if ($stmtCheckEmail->rowCount() > 0) {
            return "Este email já está em uso por outra conta.";
        }
        
        $query = "UPDATE " . $this->db_table . " SET name = :name, email = :email, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);

        if ($stmt->execute()) {
            // Atualizar dados da sessão se o usuário logado for o mesmo
            if (isset($_SESSION['user_id']) && $_SESSION['user_id'] == $id) {
                $_SESSION['user_name'] = $name;
                $_SESSION['user_email'] = $email;
            }
            return true;
        }
        return "Erro ao atualizar perfil no banco de dados.";
    }

    public function updatePassword($id, $currentPassword, $newPassword) {
         if (empty($currentPassword) || empty($newPassword)) {
            return "Todos os campos de senha são obrigatórios.";
        }
        if (strlen($newPassword) < 6) {
            return "A nova senha deve ter pelo menos 6 caracteres.";
        }

        $queryUser = "SELECT password_hash FROM " . $this->db_table . " WHERE id = :id LIMIT 1";
        $stmtUser = $this->conn->prepare($queryUser);
        $stmtUser->bindParam(':id', $id, PDO::PARAM_INT);
        $stmtUser->execute();
        $userData = $stmtUser->fetch(PDO::FETCH_ASSOC);

        if ($userData && password_verify($currentPassword, $userData['password_hash'])) {
            $newPasswordHash = password_hash($newPassword, PASSWORD_BCRYPT);
            $queryUpdate = "UPDATE " . $this->db_table . " SET password_hash = :password_hash, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
            $stmtUpdate = $this->conn->prepare($queryUpdate);
            $stmtUpdate->bindParam(':password_hash', $newPasswordHash);
            $stmtUpdate->bindParam(':id', $id, PDO::PARAM_INT);
            if ($stmtUpdate->execute()) {
                return true;
            }
            return "Erro ao atualizar senha no banco de dados.";
        }
        return "Senha atual incorreta.";
    }

    public function updateApiKey($id, $apiKey) {
        // Se a API key for vazia, salvamos NULL para indicar que não há chave ou foi removida.
        $encryptedApiKey = !empty($apiKey) ? Auth::encryptApiKey($apiKey) : null;
        
        if (!empty($apiKey) && $encryptedApiKey === null) {
            return "Erro ao criptografar a chave API."; // Falha na criptografia
        }

        $query = "UPDATE " . $this->db_table . " SET api_key_encrypted = :api_key_encrypted, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':api_key_encrypted', $encryptedApiKey); // Permite NULL
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            return true;
        }
        return "Erro ao atualizar chave API no banco de dados.";
    }
}
?> 
