<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Config/AppConfig.php'; // Para constantes e session_start via Auth
require_once __DIR__ . '/../../src/Core/Auth.php';
require_once __DIR__ . '/../../src/Core/PromptService.php';

$auth = new Auth(); // Auth construtor já chama session_start e configura sessão

if (!$auth->isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Usuário não autenticado. Por favor, faça login.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido. Apenas POST é aceito.']);
    exit;
}

// Verificar CSRF token do header (enviado pelo Axios globalmente)
$submittedToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
if (!$submittedToken || !Auth::verifyCsrfToken($submittedToken)) {
    http_response_code(403); // Forbidden
    echo json_encode(['error' => 'Falha na validação CSRF. Recarregue a página e tente novamente.']);
    exit;
}
// Após a verificação bem-sucedida, para tokens CSRF que são por sessão (não single-use), não precisamos invalidá-lo aqui.
// Se fosse single-use, você chamaria Auth::generateCsrfToken() para gerar um novo para a próxima requisição.

$requestData = json_decode(file_get_contents('php://input'), true);

// O token csrf_token_generate não é mais esperado no corpo da $requestData
// $csrfTokenFromBody = $requestData['csrf_token_generate'] ?? ''; // LINHA REMOVIDA

$finalPromptText = $requestData['final_prompt_text'] ?? '';
$rawPromptText = $requestData['raw_prompt_text'] ?? $finalPromptText; // Fallback se raw não for enviado
$templateIdUsed = $requestData['template_id_used'] ?? null;
$templateCustomValues = $requestData['template_custom_values'] ?? [];

$generationParams = [];
if (isset($requestData['temperature']) && is_numeric($requestData['temperature'])) {
    $generationParams['temperature'] = (float)$requestData['temperature'];
} else {
    $generationParams['temperature'] = 0.7; // Valor padrão se não enviado ou inválido
}
if (isset($requestData['maxOutputTokens']) && is_numeric($requestData['maxOutputTokens'])) {
    $generationParams['maxOutputTokens'] = (int)$requestData['maxOutputTokens'];
} else {
    $generationParams['maxOutputTokens'] = 1024; // Valor padrão
}
// Adicionar validação para topK, topP se forem implementados

if (empty($finalPromptText)) {
    http_response_code(400);
    echo json_encode(['error' => 'O texto final do prompt não pode ser vazio.']);
    exit;
}

$userId = $auth->getUserId();
$promptService = new PromptService();

$result = $promptService->generateGeminiPrompt($userId, $finalPromptText, $generationParams);

if (isset($result['error'])) {
    $httpStatusCode = 500; 
    if (strpos(strtolower($result['error']), 'chave da api') !== false || strpos(strtolower($result['error']), 'api key') !== false) {
        $httpStatusCode = 400; 
    } elseif (strpos(strtolower($result['error']), 'bloqueada por motivos de segurança') !== false) {
        $httpStatusCode = 400; 
    }
    http_response_code($httpStatusCode);
    echo json_encode(['error' => $result['error']]);
} else if (isset($result['success'])) {
    $inputParamsForHistory = [
        'raw_prompt_text' => $rawPromptText,
        'final_prompt_text' => $finalPromptText,
        'template_id_used' => $templateIdUsed,
        'template_custom_values' => $templateCustomValues,
        'generation_settings_input' => $generationParams
    ];
    
    $geminiParamsUsedForHistory = $generationParams; // Ou o que a API Gemini realmente usou/retornou
    
    $promptService->saveToHistory(
        $userId, 
        json_encode($inputParamsForHistory), 
        $result['success'], 
        json_encode($geminiParamsUsedForHistory),
        $result['promptTokenCount'] ?? null,
        $result['candidatesTokenCount'] ?? null
    );

    echo json_encode([
        'success' => true, 
        'generated_text' => $result['success'],
        // 'promptTokenCount' => $result['promptTokenCount'] ?? null, // Opcional retornar ao frontend
        // 'candidatesTokenCount' => $result['candidatesTokenCount'] ?? null
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Resposta inesperada do serviço de prompt.']);
}
exit;
?>