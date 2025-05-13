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

$userId = $auth->getUserId();
$templateManager = new TemplateManager();
$templates = $templateManager->getTemplatesByUser($userId);

echo json_encode(['success' => true, 'templates' => $templates]);
exit;
?>