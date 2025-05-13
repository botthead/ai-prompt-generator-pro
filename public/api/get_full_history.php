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

$userId = $auth->getUserId();
$promptService = new PromptService(); // PromptService agora precisa de um método para contar e buscar com pesquisa/paginação

$page = filter_input(INPUT_GET, 'page', FILTER_VALIDATE_INT, ['options' => ['default' => 1, 'min_range' => 1]]);
$perPage = filter_input(INPUT_GET, 'perPage', FILTER_VALIDATE_INT, ['options' => ['default' => 10, 'min_range' => 5, 'max_range' => 50]]);
$searchTerm = trim(filter_input(INPUT_GET, 'search', FILTER_SANITIZE_STRING) ?? '');

$offset = ($page - 1) * $perPage;

// O método getHistoryForUser precisa ser adaptado ou um novo criado para busca e contagem total.
// Por agora, vamos simplificar e apenas usar o getHistoryForUser, a busca real seria no SQL.

// Para a contagem total com busca, você precisaria de uma query SQL como:
// "SELECT COUNT(*) as total FROM prompts_history WHERE user_id = :user_id AND (input_parameters LIKE :search OR generated_text LIKE :search)"
// E um método em PromptService para executar isso.

// Simulando a contagem total (deve ser feita no banco)
// Para este exemplo, vamos pegar um pouco mais e limitar no PHP, mas o ideal é o DB fazer o trabalho.
$allUserHistory = $promptService->getHistoryForUser($userId, 1000, 0); // Pega tudo para simular
$filteredHistory = [];
if (!empty($searchTerm)) {
    foreach ($allUserHistory as $item) {
        if (stripos($item['input_parameters'], $searchTerm) !== false || stripos($item['generated_text_preview'], $searchTerm) !== false) {
            $filteredHistory[] = $item;
        }
    }
} else {
    $filteredHistory = $allUserHistory;
}

$totalItems = count($filteredHistory);
$totalPages = ceil($totalItems / $perPage);
$currentPageItems = array_slice($filteredHistory, $offset, $perPage);


// NOTA: A abordagem acima de buscar tudo e filtrar/paginar no PHP é INEFICIENTE para grandes volumes de dados.
// O ideal é modificar PromptService::getHistoryForUser para aceitar $searchTerm e fazer a busca e paginação no SQL.
// Exemplo de como ficaria em PromptService (não implementado completamente aqui):
/*
public function getHistoryForUser($userId, $limit = 10, $offset = 0, $searchTerm = '') {
    $sqlSearch = "";
    $params = [':user_id' => $userId, ':limit' => $limit, ':offset' => $offset];
    if (!empty($searchTerm)) {
        $sqlSearch = " AND (input_parameters LIKE :search OR generated_text LIKE :search) ";
        $params[':search'] = '%' . $searchTerm . '%';
    }
    $query = "SELECT SQL_CALC_FOUND_ROWS id, input_parameters, SUBSTRING(generated_text, 1, 200) as generated_text_preview, created_at 
              FROM " . $this->history_table . " 
              WHERE user_id = :user_id " . $sqlSearch .
              " ORDER BY created_at DESC 
              LIMIT :limit OFFSET :offset";
    // ... executar query ...
    // $totalQuery = $this->conn->query("SELECT FOUND_ROWS()");
    // $totalItems = $totalQuery->fetchColumn();
    // return ['items' => $items, 'totalItems' => $totalItems];
}
*/


echo json_encode([
    'success' => true,
    'history' => $currentPageItems,
    'pagination' => [
        'currentPage' => $page,
        'perPage' => $perPage,
        'totalPages' => $totalPages,
        'totalItems' => $totalItems
    ]
]);
exit;
?>