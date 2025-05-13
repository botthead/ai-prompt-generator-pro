<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Config/AppConfig.php';
require_once __DIR__ . '/../../src/Core/Auth.php';
require_once __DIR__ . '/../../src/Core/PromptService.php';

$auth = new Auth();
if (!$auth->isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Não autenticado. Por favor, faça login.']);
    exit;
}

$userId = $auth->getUserId();
$promptService = new PromptService();

// Pega o parâmetro 'limit' da URL, com um padrão de 5 se não for fornecido ou inválido.
$limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT, [
    'options' => ['default' => 5, 'min_range' => 1, 'max_range' => 20]
]);

try {
    // O método getHistoryForUser já retorna 'generated_text_preview' e 'generated_text' completo.
    // O offset é 0 para pegar os itens mais recentes.
    $historyItems = $promptService->getHistoryForUser($userId, $limit, 0);

    if ($historyItems === false) {
        // Isso pode indicar um erro na query dentro de getHistoryForUser
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erro no banco de dados ao buscar histórico recente.']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'history' => $historyItems 
        // Cada item em $historyItems já deve conter 'generated_text_preview' para a lista
        // e 'generated_text' completo se o modal for usar o mesmo dado.
    ]);

} catch (PDOException $e) {
    // Logar $e->getMessage() em um ambiente de produção
    error_log("PDOException in get_recent_history.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro de banco de dados ao processar sua solicitação.']);
} catch (Exception $e) {
    // Logar $e->getMessage()
    error_log("Exception in get_recent_history.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Ocorreu um erro inesperado.']);
}
exit;
?>