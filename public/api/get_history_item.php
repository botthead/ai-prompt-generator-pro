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

$itemId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if (!$itemId) {
    http_response_code(400);
    echo json_encode(['error' => 'ID do item do histórico inválido ou não fornecido.']);
    exit;
}

$userId = $auth->getUserId();
$promptService = new PromptService();
$item = $promptService->getHistoryItemByIdForUser($itemId, $userId);

if ($item) {
    echo json_encode(['success' => true, 'item' => $item]);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Item do histórico não encontrado ou você não tem permissão para acessá-lo.']);
}
exit;
?>