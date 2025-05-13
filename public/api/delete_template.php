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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { // Espera POST para deleção
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido.']);
    exit;
}

$requestData = json_decode(file_get_contents('php://input'), true);
// Assume que o token CSRF é enviado no corpo JSON para POSTs de API
// ou você pode enviá-lo como um header customizado.
// Para simplicidade aqui, vamos assumir que foi enviado no corpo.
if (!isset($requestData['csrf_token']) || !Auth::verifyCsrfToken($requestData['csrf_token'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Falha na validação CSRF.']);
    exit;
}


$templateId = filter_var($requestData['id'] ?? null, FILTER_VALIDATE_INT);

if (!$templateId) {
    http_response_code(400);
    echo json_encode(['error' => 'ID do template inválido ou não fornecido.']);
    exit;
}

$userId = $auth->getUserId();
$templateManager = new TemplateManager();

if ($templateManager->deleteTemplateForUser($templateId, $userId)) {
    echo json_encode(['success' => true, 'message' => 'Template excluído com sucesso.']);
} else {
    http_response_code(500); // Ou 404 se o template não foi encontrado para o usuário
    echo json_encode(['error' => 'Erro ao excluir o template ou template não encontrado.']);
}
exit;
?>