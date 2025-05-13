<?php
require_once __DIR__ . '/../Config/Database.php';

class TemplateManager {
    private $conn;
    private $table_name = "prompt_templates";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function createTemplate($userId, $name, $description, $promptStructure, $customFieldsJson = null) {
        if (empty($name) || empty($promptStructure)) {
            return ['error' => "Nome e estrutura do template são obrigatórios."];
        }
        if (!is_null($customFieldsJson)) {
            json_decode($customFieldsJson);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return ['error' => "Formato inválido para campos personalizados (deve ser JSON válido ou NULL)."];
            }
        } else {
            $customFieldsJson = null; // Garante que é NULL se vazio
        }


        $query = "INSERT INTO " . $this->table_name . " (user_id, name, description, prompt_structure, custom_fields) 
                  VALUES (:user_id, :name, :description, :prompt_structure, :custom_fields)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':prompt_structure', $promptStructure);
        $stmt->bindParam(':custom_fields', $customFieldsJson);

        try {
            if ($stmt->execute()) {
                return ['success' => true, 'id' => $this->conn->lastInsertId()];
            }
        } catch (PDOException $e) {
            // Log $e->getMessage()
            return ['error' => "Erro de banco de dados ao criar template."];
        }
        return ['error' => "Erro desconhecido ao criar template."];
    }

    public function getTemplatesByUser($userId) {
        $query = "SELECT id, name, description FROM " . $this->table_name . " WHERE user_id = :user_id ORDER BY name ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTemplateByIdForUser($templateId, $userId) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id AND user_id = :user_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $templateId, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        $template = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($template && isset($template['custom_fields'])) {
             $decoded_fields = json_decode($template['custom_fields'], true);
             // Se json_decode falhar e não for nulo, pode ser um problema. Por ora, retornamos como está.
             // Poderia adicionar uma verificação aqui se json_last_error() !== JSON_ERROR_NONE
             $template['custom_fields_decoded'] = is_array($decoded_fields) ? $decoded_fields : [];
        } else if ($template) {
            $template['custom_fields_decoded'] = [];
        }
        return $template;
    }

    public function updateTemplate($templateId, $userId, $name, $description, $promptStructure, $customFieldsJson = null) {
        if (empty($name) || empty($promptStructure)) {
            return ['error' => "Nome e estrutura do template são obrigatórios."];
        }
        if (!is_null($customFieldsJson)) {
            json_decode($customFieldsJson);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return ['error' => "Formato inválido para campos personalizados (deve ser JSON válido ou NULL)."];
            }
        } else {
            $customFieldsJson = null;
        }

        $query = "UPDATE " . $this->table_name . " SET name = :name, description = :description, 
                  prompt_structure = :prompt_structure, custom_fields = :custom_fields, updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':prompt_structure', $promptStructure);
        $stmt->bindParam(':custom_fields', $customFieldsJson);
        $stmt->bindParam(':id', $templateId, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);

        try {
            if ($stmt->execute()) {
                return ['success' => true];
            }
        } catch (PDOException $e) {
             // Log $e->getMessage()
            return ['error' => "Erro de banco de dados ao atualizar template."];
        }
        return ['error' => "Erro desconhecido ao atualizar template ou template não encontrado/não pertence ao usuário."];
    }

    public function deleteTemplateForUser($templateId, $userId) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $templateId, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        if ($stmt->execute()) {
            return $stmt->rowCount() > 0;
        }
        return false;
    }
}
?>