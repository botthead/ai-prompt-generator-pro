<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Config/AppConfig.php';
require_once __DIR__ . '/../../src/Core/Auth.php';
require_once __DIR__ . '/../../src/Core/PromptService.php';

$auth = new Auth();
if (!$auth->isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autenticado.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido.']);
    exit;
}

$requestData = json_decode(file_get_contents('php://input'), true);
// Assumindo que o token CSRF é enviado no corpo JSON.
// Verifique se o nome do token CSRF é consistente com o que o JS envia.
if (!isset($requestData['csrf_token']) || !Auth::verifyCsrfToken($requestData['csrf_token'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Falha na validação CSRF.']);
    exit;
}

$itemId = filter_var($requestData['id'] ?? null, FILTER_VALIDATE_INT);

if (!$itemId) {
    http_response_code(400);
    echo json_encode(['error' => 'ID do item do histórico inválido ou não fornecido.']);
    exit;
}

$userId = $auth->getUserId();
$promptService = new PromptService();

if ($promptService->deleteHistoryItemForUser($itemId, $userId)) {
    echo json_encode(['success' => true, 'message' => 'Item do histórico excluído com sucesso.']);
} else {
    http_response_code(500); // Ou 404
    echo json_encode(['error' => 'Erro ao excluir o item do histórico ou item não encontrado.']);
}
exit;
?>