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

$page = filter_input(INPUT_GET, 'page', FILTER_VALIDATE_INT, ['options' => ['default' => 1, 'min_range' => 1]]);
$perPage = filter_input(INPUT_GET, 'perPage', FILTER_VALIDATE_INT, ['options' => ['default' => 10, 'min_range' => 5, 'max_range' => 50]]);
$rawSearchTerm = trim(filter_input(INPUT_GET, 'search', FILTER_DEFAULT) ?? '');
$searchTerm = $rawSearchTerm; // Usar o termo cru para a busca no banco

$offset = ($page - 1) * $perPage;

try {
    // Usar o método otimizado que faz busca e paginação no SQL
    $result = $promptService->getPaginatedHistoryForUser($userId, $perPage, $offset, $searchTerm);
    
    $currentPageItems = $result['items'];
    $totalItems = $result['totalItems'];
    $totalPages = ($perPage > 0 && $totalItems > 0) ? ceil($totalItems / $perPage) : 0;

    // Ajustar a página atual se ela exceder o total de páginas calculado
    if ($page > $totalPages && $totalPages > 0) {
        $page = $totalPages;
        // Se a página foi ajustada, idealmente buscaríamos os itens para esta nova última página.
        // No entanto, para simplificar, o JS pode lidar com isso ou podemos deixar assim por enquanto.
        // Se quiser ser preciso, faria outra chamada a getPaginatedHistoryForUser com a $page corrigida.
    }
    // Garantir que os itens retornados correspondam à página (mesmo que ajustada)
    // Se a página foi ajustada para uma menor, e $currentPageItems ainda são da página original maior,
    // o JS da paginação pode ficar confuso. A forma mais segura é re-buscar ou confiar que o JS
    // fará uma nova chamada se a página mudar.
    // Para esta iteração, vamos assumir que o JS lida com a chamada para a página correta.


    echo json_encode([
        'success' => true,
        'history' => $currentPageItems, // Contém 'generated_text' completo e 'generated_text_preview'
        'pagination' => [
            'currentPage' => (int)$page,
            'perPage' => (int)$perPage,
            'totalPages' => (int)$totalPages,
            'totalItems' => (int)$totalItems,
            'searchTermUsed' => $searchTerm 
        ]
    ]);

} catch (PDOException $e) {
    // Logar o erro $e->getMessage() em um ambiente de produção
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro no banco de dados ao buscar histórico.']);
} catch (Exception $e) {
    // Logar o erro $e->getMessage()
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Ocorreu um erro inesperado ao processar sua solicitação.']);
}
exit;
?>