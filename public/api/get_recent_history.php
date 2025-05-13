<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Config/AppConfig.php';
require_once __DIR__ . '/../../src/Core/Auth.php';
require_once __DIR__ . '/../../src/Core/PromptService.php';

$auth = new Auth();
if (!$auth->isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Não autenticado.']);
    exit;
}

$userId = $auth->getUserId();
$promptService = new PromptService();

// Definir limite para o histórico recente, pode ser um parâmetro GET se necessário
$limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT, ['options' => ['default' => 5, 'min_range' => 1, 'max_range' => 20]]);

try {
    // Usar o método getHistoryForUser que já pega o preview e o texto completo.
    // Este método já faz LIMIT e OFFSET, então o offset será 0 para os mais recentes.
    $historyItems = $promptService->getHistoryForUser($userId, $limit, 0);

    if ($historyItems === false) { // Se o método retornar false em erro de DB
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erro no banco de dados ao buscar histórico recente.']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'history' => $historyItems // Contém 'generated_text_preview' e 'generated_text' completo
    ]);

} catch (PDOException $e) {
    // Logar o erro $e->getMessage()
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro de banco de dados ao buscar histórico recente.']);
} catch (Exception $e) {
    // Logar o erro $e->getMessage()
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Ocorreu um erro inesperado ao buscar o histórico recente.']);
}
exit;
?>