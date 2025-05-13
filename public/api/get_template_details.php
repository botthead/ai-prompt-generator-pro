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

$templateId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if (!$templateId) {
    http_response_code(400);
    echo json_encode(['error' => 'ID do template inválido ou não fornecido.']);
    exit;
}

$userId = $auth->getUserId();
$templateManager = new TemplateManager();
$template = $templateManager->getTemplateByIdForUser($templateId, $userId);

if ($template) {
    // 'custom_fields_decoded' já deve estar no $template vindo do getTemplateByIdForUser
    echo json_encode(['success' => true, 'template' => $template]);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Template não encontrado ou você não tem permissão para acessá-lo.']);
}
exit;
?>