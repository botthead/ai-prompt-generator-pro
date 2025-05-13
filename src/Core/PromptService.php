<?php
require_once __DIR__ . '/../Config/Database.php';
require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/User.php';

class PromptService {
    private $conn;
    private $history_table = "prompts_history";
    // user_table não é mais necessário aqui se a API key é passada para generateGeminiPrompt

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    // generateGeminiPrompt (como estava, aceitando $decryptedApiKey)
    public function generateGeminiPrompt($decryptedApiKey, $promptText, $generationParams = []) {
        $apiKey = $decryptedApiKey;
        if (empty($apiKey)) {
            return ['error' => 'Chave da API Gemini não fornecida para o serviço de prompt.'];
        }
        $geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' . $apiKey;
        $contents = [['role' => 'user', 'parts' => [['text' => $promptText]]]];
        $requestBody = ['contents' => $contents];
        $defaultGenerationConfig = [
            'temperature' => 0.7, 'topK' => 1, 'topP' => 1, 'maxOutputTokens' => 2048,
        ];
        $requestBody['generationConfig'] = array_merge($defaultGenerationConfig, $generationParams);
        $requestBody['safetySettings'] = [
            ['category' => 'HARM_CATEGORY_HARASSMENT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
            ['category' => 'HARM_CATEGORY_HATE_SPEECH', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
            ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
            ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
        ];

        $ch = curl_init($geminiApiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestBody));
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Mantenha false para XAMPP local se tiver problemas de SSL
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false); // Mantenha false para XAMPP local

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) { return ['error' => "Erro na comunicação com a API Gemini: " . $curlError]; }
        $responseData = json_decode($response, true);
        if ($httpCode != 200 || isset($responseData['error'])) {
            $apiErrorMsg = $responseData['error']['message'] ?? ($response ?: 'Erro desconhecido da API.');
            return ['error' => "Erro da API Gemini (HTTP {$httpCode}): " . $apiErrorMsg];
        }
        if (isset($responseData['candidates'][0]['finishReason']) && $responseData['candidates'][0]['finishReason'] == 'SAFETY') {
            // ... (lógica de erro de segurança como antes) ...
            return ['error' => 'A resposta da IA foi bloqueada por motivos de segurança. Tente reformular.'];
        }
        if (!isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
            return ['error' => 'Resposta da API Gemini em formato inesperado ou vazia.'];
        }
        $generatedText = $responseData['candidates'][0]['content']['parts'][0]['text'];
        // Obter contagem de tokens se a API os fornecer (verificar documentação do Gemini)
        $promptTokenCount = $responseData['usageMetadata']['promptTokenCount'] ?? null;
        $candidatesTokenCount = $responseData['usageMetadata']['candidatesTokenCount'] ?? null;

        return [
            'success' => $generatedText,
            'promptTokenCount' => $promptTokenCount,
            'candidatesTokenCount' => $candidatesTokenCount
        ];
    }

    public function saveToHistory($userId, $inputParametersJson, $generatedText, $geminiParamsUsedJson, $promptTokens = null, $responseTokens = null) {
        // ... (como antes) ...
        $query = "INSERT INTO " . $this->history_table . 
                 " (user_id, input_parameters, generated_text, gemini_parameters_used, token_count_prompt, token_count_response) 
                  VALUES (:user_id, :input_parameters, :generated_text, :gemini_parameters_used, :token_count_prompt, :token_count_response)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':input_parameters', $inputParametersJson);
        $stmt->bindParam(':generated_text', $generatedText);
        $stmt->bindParam(':gemini_parameters_used', $geminiParamsUsedJson);
        $stmt->bindParam(':token_count_prompt', $promptTokens, PDO::PARAM_INT); // Permite NULL
        $stmt->bindParam(':token_count_response', $responseTokens, PDO::PARAM_INT); // Permite NULL
        try { return $stmt->execute(); } catch (PDOException $e) { return false; }
    }

    // Método para o histórico recente no dashboard e para a página de histórico (com paginação básica)
    // Idealmente, este método seria substituído por um que faça paginação/busca no SQL
    public function getHistoryForUser($userId, $limit = 10, $offset = 0) {
        $query = "SELECT id, input_parameters, SUBSTRING(generated_text, 1, 200) as generated_text_preview, generated_text, created_at 
                  FROM " . $this->history_table . " 
                  WHERE user_id = :user_id 
                  ORDER BY created_at DESC 
                  LIMIT :limit OFFSET :offset";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Método para buscar todos os dados para exportação ou paginação ineficiente no PHP
    public function getAllHistoryForUserForExport($userId) {
        $query = "SELECT id, user_id, input_parameters, generated_text, gemini_parameters_used, token_count_prompt, token_count_response, created_at 
                  FROM " . $this->history_table . " 
                  WHERE user_id = :user_id 
                  ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Método para contar o total de itens do histórico para um usuário (pode incluir busca)
    public function countHistoryForUser($userId, $searchTerm = '') {
        $sqlSearch = "";
        $params = [':user_id' => $userId];
        if (!empty($searchTerm)) {
            $sqlSearch = " AND (input_parameters LIKE :search_term OR generated_text LIKE :search_term) ";
            $params[':search_term'] = '%' . $searchTerm . '%';
        }
        $query = "SELECT COUNT(*) as total FROM " . $this->history_table . " WHERE user_id = :user_id " . $sqlSearch;
        $stmt = $this->conn->prepare($query);
        // Bind parameters
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        if (!empty($searchTerm)) {
            $stmt->bindParam(':search_term', $params[':search_term']);
        }
        $stmt->execute();
        return (int)$stmt->fetchColumn();
    }

    // Método otimizado para paginação e busca no SQL (PREFERÍVEL)
    public function getPaginatedHistoryForUser($userId, $limit = 10, $offset = 0, $searchTerm = '') {
        $sqlSearch = "";
        $paramsSQL = []; // Para os binds da query principal
        $countParamsSQL = []; // Para os binds da query de contagem

        $paramsSQL[':user_id'] = $userId;
        $countParamsSQL[':user_id'] = $userId;

        if (!empty($searchTerm)) {
            $sqlSearch = " AND (input_parameters LIKE :search_term OR generated_text LIKE :search_term) ";
            $paramsSQL[':search_term'] = '%' . $searchTerm . '%';
            $countParamsSQL[':search_term'] = '%' . $searchTerm . '%';
        }

        // Query para contar o total de itens filtrados
        $countQuery = "SELECT COUNT(*) FROM " . $this->history_table . " WHERE user_id = :user_id " . $sqlSearch;
        $stmtCount = $this->conn->prepare($countQuery);
        foreach ($countParamsSQL as $key => &$val) { // Passar por referência para bindParam
            $stmtCount->bindParam($key, $val);
        }
        $stmtCount->execute();
        $totalItems = (int)$stmtCount->fetchColumn();

        // Query para buscar os itens paginados e filtrados
        // Retornar generated_text completo para o modal, e o JS pode truncar para preview na tabela
        $query = "SELECT id, input_parameters, generated_text, SUBSTRING(generated_text, 1, 200) as generated_text_preview, created_at 
                  FROM " . $this->history_table . " 
                  WHERE user_id = :user_id " . $sqlSearch .
                 " ORDER BY created_at DESC 
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        foreach ($paramsSQL as $key => &$val) {
            $stmt->bindParam($key, $val);
        }
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return ['items' => $items, 'totalItems' => $totalItems];
    }


    public function getHistoryItemByIdForUser($itemId, $userId) {
        // Retorna o generated_text completo para o modal
        $query = "SELECT id, input_parameters, generated_text, gemini_parameters_used, token_count_prompt, token_count_response, created_at 
                  FROM " . $this->history_table . " WHERE id = :id AND user_id = :user_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $itemId, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deleteHistoryItemForUser($itemId, $userId) {
        // ... (como antes) ...
        $query = "DELETE FROM " . $this->history_table . " WHERE id = :id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $itemId, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        if ($stmt->execute()) { return $stmt->rowCount() > 0; }
        return false;
    }
}
?>