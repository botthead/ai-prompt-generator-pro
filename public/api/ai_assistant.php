<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Config/AppConfig.php';
require_once __DIR__ . '/../../src/Core/Auth.php';
require_once __DIR__ . '/../../src/Core/PromptService.php'; // Usaremos para chamar a API Gemini

$auth = new Auth();
if (!$auth->isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autenticado.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido. Apenas POST é aceito.']);
    exit;
}

// Verificar CSRF token do header
$submittedToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
if (!$submittedToken || !Auth::verifyCsrfToken($submittedToken)) {
    http_response_code(403);
    echo json_encode(['error' => 'Falha na validação CSRF.']);
    exit;
}

// Os dados são esperados no corpo JSON da requisição POST
$requestData = json_decode(file_get_contents('php://input'), true);

// O token CSRF não é mais esperado no corpo da $requestData

$actionType = $requestData['action_type'] ?? null;
$currentPromptText = $requestData['current_prompt_text'] ?? '';
$userInputIdea = $requestData['user_input_idea'] ?? '';
$selectedNewTone = $requestData['new_tone'] ?? '';
$suggestionCount = filter_var($requestData['suggestion_count'] ?? 3, FILTER_VALIDATE_INT, ['options' => ['default' => 3, 'min_range' => 1, 'max_range' => 5]]);


if (!$actionType) {
    http_response_code(400);
    echo json_encode(['error' => 'Tipo de ação da assistência não especificado.']);
    exit;
}

$userId = $auth->getUserId();
$promptService = new PromptService();
$metaPrompt = "";
// Parâmetros de geração para o assistente podem ser diferentes dos do usuário para o prompt final
$generationParamsAssist = ['temperature' => 0.65, 'maxOutputTokens' => 768]; 

switch ($actionType) {
    case 'analyze_prompt':
        if (empty($currentPromptText)) { 
            http_response_code(400); echo json_encode(['error' => 'Prompt para análise está vazio.']); exit; 
        }
        $metaPrompt = "Por favor, analise o seguinte prompt de IA em termos de clareza, especificidade, potencial de ambiguidade e forneça sugestões de melhoria concisas em formato de tópicos (use markdown para formatação, como listas com '*' ou '-').\n\nPROMPT ORIGINAL:\n\"\"\"\n" . $currentPromptText . "\n\"\"\"\n\nANÁLISE E SUGESTÕES:";
        break;
    case 'suggest_variations':
        if (empty($currentPromptText)) { 
            http_response_code(400); echo json_encode(['error' => 'Prompt para gerar variações está vazio.']); exit; 
        }
        $metaPrompt = "Dado o prompt de IA abaixo, gere " . $suggestionCount . " variações criativas e distintas que mantenham o objetivo central, mas explorem diferentes abordagens, tons ou focos. Liste cada variação claramente, separadas por '---VARIANT---'. Não adicione numeração ou marcadores antes de cada variação, apenas o texto da variação.\n\nPROMPT ORIGINAL:\n\"\"\"\n" . $currentPromptText . "\n\"\"\"\n\nVARIAÇÕES:";
        break;
    case 'expand_idea':
        if (empty($userInputIdea)) { 
            http_response_code(400); echo json_encode(['error' => 'Ideia para expandir está vazia.']); exit; 
        }
        $metaPrompt = "Expanda a seguinte ideia curta em um prompt de IA mais detalhado e acionável. A ideia é: \"${userInputIdea}\". Desenvolva-o com mais contexto, especificações e instruções claras para a IA. Retorne apenas o prompt detalhado gerado.\n\nPROMPT DETALHADO GERADO:";
        break;
    case 'simplify_prompt':
        if (empty($currentPromptText)) { 
            http_response_code(400); echo json_encode(['error' => 'Prompt para simplificar está vazio.']); exit; 
        }
        $metaPrompt = "Simplifique a linguagem do seguinte prompt de IA, tornando-o mais direto e fácil de entender, sem perder a intenção original. Retorne apenas o prompt simplificado.\n\nPROMPT ORIGINAL:\n\"\"\"\n" . $currentPromptText . "\n\"\"\"\n\nPROMPT SIMPLIFICADO:";
        break;
    case 'change_tone':
        if (empty($currentPromptText)) { 
            http_response_code(400); echo json_encode(['error' => 'Prompt para alterar o tom está vazio.']); exit; 
        }
        if (empty($selectedNewTone)) { 
            http_response_code(400); echo json_encode(['error' => 'Novo tom não selecionado.']); exit; 
        }
        $metaPrompt = "Reescreva o seguinte prompt de IA para ter um tom '" . htmlspecialchars($selectedNewTone) . "', mantendo o objetivo central. Retorne apenas o prompt com o novo tom.\n\nPROMPT ORIGINAL:\n\"\"\"\n" . $currentPromptText . "\n\"\"\"\n\nPROMPT COM TOM '" . htmlspecialchars($selectedNewTone) . "':";
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Tipo de ação da assistência inválido.']);
        exit;
}

$result = $promptService->generateGeminiPrompt($userId, $metaPrompt, $generationParamsAssist);

if (isset($result['error'])) {
    // Tentar determinar um código HTTP mais apropriado
    $httpStatusCode = 500;
    if (strpos(strtolower($result['error']), 'chave da api') !== false || strpos(strtolower($result['error']), 'api key') !== false) {
        $httpStatusCode = 400; 
    } elseif (strpos(strtolower($result['error']), 'bloqueada por motivos de segurança') !== false) {
        $httpStatusCode = 400; 
    }
    http_response_code($httpStatusCode);
    echo json_encode(['error' => $result['error']]);
} else if (isset($result['success'])) {
    echo json_encode(['success' => true, 'assisted_text' => $result['success'], 'action_type_processed' => $actionType]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Resposta inesperada do serviço de assistência IA.']);
}
exit;
?>