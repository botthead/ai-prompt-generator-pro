<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Config/AppConfig.php';
require_once __DIR__ . '/../../src/Core/Auth.php';
require_once __DIR__ . '/../../src/Core/TemplateManager.php';

$auth = new Auth();
if (!$auth->isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autenticado.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido. Apenas POST é aceito para exclusão.']);
    exit;
}

// Verificar CSRF token do header
$submittedToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
if (!$submittedToken || !Auth::verifyCsrfToken($submittedToken)) {
    http_response_code(403);
    echo json_encode(['error' => 'Falha na validação CSRF.']);
    exit;
}

// Os dados (como o ID) são esperados no corpo JSON da requisição POST
$requestData = json_decode(file_get_contents('php://input'), true);

// O token CSRF não é mais esperado no corpo da $requestData
// if (!isset($requestData['csrf_token']) ... ) // LINHA REMOVIDA

$templateId = null;
if (isset($requestData['id'])) {
    $templateId = filter_var($requestData['id'], FILTER_VALIDATE_INT);
}


if (!$templateId) {
    http_response_code(400);
    echo json_encode(['error' => 'ID do template inválido ou não fornecido no corpo da requisição.']);
    exit;
}

$userId = $auth->getUserId();
$templateManager = new TemplateManager();

if ($templateManager->deleteTemplateForUser($templateId, $userId)) {
    echo json_encode(['success' => true, 'message' => 'Template excluído com sucesso.']);
} else {
    // Pode ser que o template não exista ou não pertença ao usuário, ou erro de DB
    http_response_code(404); // Ou 500 se for erro de DB
    echo json_encode(['error' => 'Erro ao excluir o template, template não encontrado ou não pertence ao usuário.']);
}
exit;
?>