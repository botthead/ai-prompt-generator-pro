<?php
class Database {
    private $host = 'localhost'; // Host do banco de dados (geralmente localhost no XAMPP)
    private $db_name = 'ai_prompt_gen_db'; // Nome do banco de dados criado no schema.sql
    private $username = 'root';   // Usuário do banco de dados (padrão 'root' no XAMPP)
    private $password = '';     // Senha do banco de dados (padrão vazia no XAMPP)
    public $conn;

    // Obtém a conexão com o banco de dados
    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                'mysql:host=' . $this->host . ';dbname=' . $this->db_name . ';charset=utf8mb4',
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false); // Para melhor segurança e performance
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // Retornar arrays associativos por padrão
        } catch(PDOException $exception) {
            // Em um ambiente de produção, você não exibiria o erro diretamente.
            // Você logaria o erro e mostraria uma mensagem genérica ao usuário.
            if (defined('DEBUG_MODE') && DEBUG_MODE) {
                echo 'Erro de Conexão: ' . $exception->getMessage();
            } else {
                echo 'Erro ao conectar ao banco de dados. Tente novamente mais tarde.';
            }
            exit; // Interrompe a execução se não conseguir conectar
        }
        return $this->conn;
    }
}
?>