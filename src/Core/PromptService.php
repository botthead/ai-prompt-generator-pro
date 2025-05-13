<?php
require_once __DIR__ . '/../Config/Database.php';
require_once __DIR__ . '/Auth.php'; // Para descriptografar a API key do usuário
require_once __DIR__ . '/User.php';  // Para buscar dados do usuário

class PromptService {
    private $conn;
    private $history_table = "prompts_history";
    private $user_table = "users"; // Para buscar API Key

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function generateGeminiPrompt($userId, $promptText, $generationParams = []) {
        $userObj = new User(); // Instancia User para pegar a API key
        $userData = $userObj->getById($userId);

        if (!$userData || empty($userData['api_key_encrypted'])) {
            return ['error' => 'Chave da API Gemini não configurada. Por favor, vá para o seu perfil para configurá-la.'];
        }

        $apiKey = Auth::decryptApiKey($userData['api_key_encrypted']);
        if (!$apiKey) {
             return ['error' => 'Falha ao acessar sua chave da API Gemini. Por favor, reconfigure-a no seu perfil.'];
        }

        // Gemini 1.5 Flash é um bom modelo para custo-benefício.
        // Modelos mais potentes como "gemini-1.5-pro-latest" podem ser usados, mas são mais caros.
        $geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' . $apiKey;
        
        $contents = [['role' => 'user', 'parts' => [['text' => $promptText]]]];
        
        $requestBody = ['contents' => $contents];

        // Configurações de Geração (Safety Settings são importantes)
        $defaultGenerationConfig = [
            'temperature' => 0.7, // Padrão, pode ser sobrescrito
            'topK' => 1,          // Padrão
            'topP' => 1,          // Padrão
            'maxOutputTokens' => 2048, // Padrão
            // 'candidateCount' => 1, // Geralmente 1 é suficiente
        ];
        $requestBody['generationConfig'] = array_merge($defaultGenerationConfig, $generationParams);

        // Configurações de Segurança (ajuste os thresholds conforme necessário)
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
        curl_setopt($ch, CURLOPT_TIMEOUT, 60); // Timeout de 60 segundos para a resposta da API
        // Para XAMPP local, o SSL pode ser um problema. O ideal é configurar o PHP para usar o bundle de CA correto.
        // curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true); // Mantenha true em produção
        // curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        // Se der erro de SSL no XAMPP, uma solução temporária (NÃO PARA PRODUÇÃO) é:
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);


        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            // Log $curlError
            return ['error' => "Erro na comunicação com a API Gemini: " . $curlError];
        }

        $responseData = json_decode($response, true);

        if ($httpCode != 200 || isset($responseData['error'])) {
            $apiErrorMsg = $responseData['error']['message'] ?? ($response ?: 'Erro desconhecido da API.');
            // Log $apiErrorMsg
            return ['error' => "Erro da API Gemini (HTTP {$httpCode}): " . $apiErrorMsg];
        }
        
        // Verificar se a resposta foi bloqueada por safety settings
        if (isset($responseData['candidates'][0]['finishReason']) && $responseData['candidates'][0]['finishReason'] == 'SAFETY') {
            $blockedCategories = [];
            if (isset($responseData['candidates'][0]['safetyRatings'])) {
                foreach ($responseData['candidates'][0]['safetyRatings'] as $rating) {
                    if ($rating['probability'] !== 'NEGLIGIBLE' && $rating['probability'] !== 'LOW') {
                         $blockedCategories[] = $rating['category'] . ' (' . $rating['probability'] . ')';
                    }
                }
            }
            $blockDetails = !empty($blockedCategories) ? implode(', ', $blockedCategories) : 'Não especificado';
            return ['error' => 'A resposta da IA foi bloqueada por motivos de segurança. Categorias: ' . $blockDetails . '. Tente reformular seu prompt.'];
        }


        if (!isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
            // Log $response
            return ['error' => 'Resposta da API Gemini em formato inesperado ou vazia.'];
        }

        $generatedText = $responseData['candidates'][0]['content']['parts'][0]['text'];
        
        // Obter contagem de tokens (se disponível na resposta - precisa verificar a doc da Gemini API)
        // $promptTokenCount = $responseData['usageMetadata']['promptTokenCount'] ?? null;
        // $candidatesTokenCount = $responseData['usageMetadata']['candidatesTokenCount'] ?? null;

        return [
            'success' => $generatedText,
            // 'promptTokenCount' => $promptTokenCount,
            // 'candidatesTokenCount' => $candidatesTokenCount
        ];
    }

    public function saveToHistory($userId, $inputParametersJson, $generatedText, $geminiParamsUsedJson, $promptTokens = null, $responseTokens = null) {
        $query = "INSERT INTO " . $this->history_table . 
                 " (user_id, input_parameters, generated_text, gemini_parameters_used, token_count_prompt, token_count_response) 
                  VALUES (:user_id, :input_parameters, :generated_text, :gemini_parameters_used, :token_count_prompt, :token_count_response)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':input_parameters', $inputParametersJson);
        $stmt->bindParam(':generated_text', $generatedText);
        $stmt->bindParam(':gemini_parameters_used', $geminiParamsUsedJson);
        $stmt->bindParam(':token_count_prompt', $promptTokens, PDO::PARAM_INT);
        $stmt->bindParam(':token_count_response', $responseTokens, PDO::PARAM_INT);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            // Log $e->getMessage()
            return false;
        }
    }

    public function getHistoryForUser($userId, $limit = 10, $offset = 0) {
        $query = "SELECT id, input_parameters, SUBSTRING(generated_text, 1, 200) as generated_text_preview, created_at 
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

    public function getHistoryItemByIdForUser($itemId, $userId) {
        $query = "SELECT * FROM " . $this->history_table . " WHERE id = :id AND user_id = :user_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $itemId, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deleteHistoryItemForUser($itemId, $userId) {
        $query = "DELETE FROM " . $this->history_table . " WHERE id = :id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $itemId, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        if ($stmt->execute()) {
            return $stmt->rowCount() > 0;
        }
        return false;
    }
}
?> 
