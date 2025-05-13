<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Config/AppConfig.php'; // Para constantes e session_start
require_once __DIR__ . '/../../src/Core/Auth.php';
require_once __DIR__ . '/../../src/Core/PromptService.php';

$auth = new Auth(); // Auth construtor já chama session_start
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

// Verificar CSRF token se enviado (recomendado para formulários principais, não tanto para APIs puras se autenticadas de outra forma)
// Mas como este é chamado de um formulário no dashboard, vamos verificar.
$requestData = json_decode(file_get_contents('php://input'), true);
if (!isset($requestData['csrf_token_generate']) || !Auth::verifyCsrfToken($requestData['csrf_token_generate'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Falha na validação CSRF. Recarregue a página e tente novamente.']);
    exit;
}

$finalPromptText = $requestData['final_prompt_text'] ?? ''; // Este será o prompt após processar templates
$rawPromptText = $requestData['raw_prompt_text'] ?? ''; // O que o usuário digitou, ou estrutura do template
$templateIdUsed = $requestData['template_id_used'] ?? null;
$templateCustomValues = $requestData['template_custom_values'] ?? []; // Valores preenchidos para os campos do template

// Parâmetros de Geração
$generationParams = [];
if (isset($requestData['temperature']) && is_numeric($requestData['temperature'])) {
    $generationParams['temperature'] = (float)$requestData['temperature'];
}
if (isset($requestData['maxOutputTokens']) && is_numeric($requestData['maxOutputTokens'])) {
    $generationParams['maxOutputTokens'] = (int)$requestData['maxOutputTokens'];
}
// Adicionar topK, topP se forem enviados

if (empty($finalPromptText)) {
    http_response_code(400);
    echo json_encode(['error' => 'O texto final do prompt não pode ser vazio.']);
    exit;
}

$userId = $auth->getUserId();
$promptService = new PromptService();

$result = $promptService->generateGeminiPrompt($userId, $finalPromptText, $generationParams);

if (isset($result['error'])) {
    // Tentar determinar um código HTTP mais apropriado
    $httpStatusCode = 500; // Erro genérico do servidor/API
    if (strpos(strtolower($result['error']), 'chave da api') !== false || strpos(strtolower($result['error']), 'api key') !== false) {
        $httpStatusCode = 400; // Bad Request - problema de configuração do usuário
    } elseif (strpos(strtolower($result['error']), 'bloqueada por motivos de segurança') !== false) {
        $httpStatusCode = 400; // Bad Request - prompt do usuário causou bloqueio
    }
    http_response_code($httpStatusCode);
    echo json_encode(['error' => $result['error']]);
} else if (isset($result['success'])) {
    // Montar os parâmetros de input para o histórico
    $inputParamsForHistory = [
        'raw_prompt_text' => $rawPromptText, // O que o usuário digitou ou a estrutura do template
        'final_prompt_text' => $finalPromptText, // O prompt enviado à API após substituições
        'template_id_used' => $templateIdUsed,
        'template_custom_values' => $templateCustomValues,
        'generation_settings_input' => $generationParams // Parâmetros que o usuário configurou
    ];
    
    // Parâmetros realmente usados pela API Gemini (pode ser igual a generationParams ou ter defaults da API)
    $geminiParamsUsedForHistory = $generationParams; // Simplificação, a API pode retornar os defaults usados
    
    $promptService->saveToHistory(
        $userId, 
        json_encode($inputParamsForHistory), 
        $result['success'], 
        json_encode($geminiParamsUsedForHistory),
        $result['promptTokenCount'] ?? null,      // Se a API retornar
        $result['candidatesTokenCount'] ?? null   // Se a API retornar
    );

    echo json_encode([
        'success' => true, 
        'generated_text' => $result['success'],
        // 'promptTokenCount' => $result['promptTokenCount'] ?? null,
        // 'candidatesTokenCount' => $result['candidatesTokenCount'] ?? null
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Resposta inesperada do serviço de prompt.']);
}
exit;
?>