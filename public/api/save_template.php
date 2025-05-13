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
    echo json_encode(['error' => 'Método não permitido.']);
    exit;
}

// Os dados do formulário são enviados como multipart/form-data ou x-www-form-urlencoded
// devido ao JS usar FormData, então acessamos via $_POST.
if (!isset($_POST['csrf_token_template_form']) || !Auth::verifyCsrfToken($_POST['csrf_token_template_form'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Falha na validação CSRF.']);
    exit;
}

$userId = $auth->getUserId();
$templateManager = new TemplateManager();

$templateId = filter_input(INPUT_POST, 'template_id', FILTER_VALIDATE_INT); // Para edição
$name = trim($_POST['template_name'] ?? '');
$description = trim($_POST['template_description'] ?? null);
$structure = trim($_POST['template_structure'] ?? '');

// Processar campos personalizados
$customFieldsArray = [];
if (isset($_POST['custom_field_name']) && is_array($_POST['custom_field_name'])) {
    foreach ($_POST['custom_field_name'] as $index => $fieldName) {
        if (!empty($fieldName)) {
            $customFieldsArray[] = [
                'name' => trim($fieldName),
                'label' => trim($_POST['custom_field_label'][$index] ?? $fieldName),
                'type' => trim($_POST['custom_field_type'][$index] ?? 'text'),
                'required' => isset($_POST['custom_field_required'][$index]),
                'placeholder' => trim($_POST['custom_field_placeholder'][$index] ?? ''),
                'options' => ($_POST['custom_field_type'][$index] === 'select' && !empty($_POST['custom_field_options'][$index])) ? array_map('trim', explode("\n", $_POST['custom_field_options'][$index])) : []
            ];
        }
    }
}
$customFieldsJson = !empty($customFieldsArray) ? json_encode($customFieldsArray) : null;

$result = null;
if ($templateId) { // Edição
    $result = $templateManager->updateTemplate($templateId, $userId, $name, $description, $structure, $customFieldsJson);
} else { // Criação
    $result = $templateManager->createTemplate($userId, $name, $description, $structure, $customFieldsJson);
}

if (isset($result['success']) && $result['success']) {
    echo json_encode($result); // Pode incluir o ID do template se for criação
} else {
    http_response_code(400); // Bad Request ou outro erro
    echo json_encode(['error' => $result['error'] ?? 'Erro ao salvar template.']);
}
exit;
?>