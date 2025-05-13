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
$promptService = new PromptService();

$page = filter_input(INPUT_GET, 'page', FILTER_VALIDATE_INT, ['options' => ['default' => 1, 'min_range' => 1]]);
$perPage = filter_input(INPUT_GET, 'perPage', FILTER_VALIDATE_INT, ['options' => ['default' => 10, 'min_range' => 5, 'max_range' => 50]]);

// Linha 19 corrigida:
$rawSearchTerm = trim(filter_input(INPUT_GET, 'search', FILTER_DEFAULT) ?? ''); // Pega o valor cru
// $searchTermForDisplay = htmlspecialchars($rawSearchTerm, ENT_QUOTES, 'UTF-8'); // Use esta se for exibir o termo de busca na UI
$searchTerm = $rawSearchTerm; // Para a lógica de busca no PHP/SQL, use o termo cru

$offset = ($page - 1) * $perPage;

// NOTA: A lógica de busca e paginação abaixo ainda é a versão ineficiente feita no PHP.
// O ideal é movê-la para o SQL no PromptService.php.
$allUserHistory = [];
$totalItems = 0;

// Se você já tem um método em PromptService que faz busca e paginação no SQL, use-o aqui.
// Exemplo: $result = $promptService->getPaginatedHistoryForUser($userId, $perPage, $offset, $searchTerm);
// $currentPageItems = $result['items'];
// $totalItems = $result['totalItems'];

// Lógica de fallback (ineficiente, mas funcional para poucos dados)
if (method_exists($promptService, 'getPaginatedHistoryForUser')) { // Verifica se o método ideal existe
    $paginatedResult = $promptService->getPaginatedHistoryForUser($userId, $perPage, $offset, $searchTerm);
    $currentPageItems = $paginatedResult['items'];
    $totalItems = $paginatedResult['totalItems'];
} else {
    // Lógica ineficiente original como fallback se o método otimizado não existir
    // Em um cenário real, você removeria esta lógica de fallback após implementar a otimizada.
    $tempAllHistory = $promptService->getAllHistoryForUserForExport($userId); // Assume que este método existe e pega todos os dados
    $filteredHistory = [];
    if (!empty($searchTerm)) {
        foreach ($tempAllHistory as $item) {
            $inputDataForSearch = json_decode($item['input_parameters'], true);
            $finalPromptForSearch = $inputDataForSearch['final_prompt_text'] ?? ($inputDataForSearch['raw_prompt_text'] ?? '');
            // generated_text não está em $item se getHistoryForUser foi usado, mas está em getAllHistoryForUserForExport
            if (stripos($finalPromptForSearch, $searchTerm) !== false || stripos($item['generated_text'], $searchTerm) !== false) {
                $filteredHistory[] = $item;
            }
        }
    } else {
        $filteredHistory = $tempAllHistory;
    }
    $totalItems = count($filteredHistory);
    $currentPageItems = array_slice($filteredHistory, $offset, $perPage);
    // Se estiver usando esta lógica de fallback, precisa ajustar o SUBSTRING no renderHistoryTable para pegar o texto completo se necessário.
    // É melhor garantir que PromptService::getPaginatedHistoryForUser retorne `generated_text_preview`
    // e o método para pegar um item individual retorne `generated_text` completo.
}


$totalPages = ($perPage > 0 && $totalItems > 0) ? ceil($totalItems / $perPage) : 0;
if ($page > $totalPages && $totalPages > 0) { // Se a página pedida for maior que o total, vai para a última
    $page = $totalPages;
    // Você poderia recarregar os itens para a última página aqui se quisesse ser muito preciso,
    // mas para o JS, apenas enviar o totalPages correto já ajuda.
}


echo json_encode([
    'success' => true,
    'history' => $currentPageItems,
    'pagination' => [
        'currentPage' => (int)$page,
        'perPage' => (int)$perPage,
        'totalPages' => (int)$totalPages,
        'totalItems' => (int)$totalItems,
        'searchTermUsed' => $searchTerm // Opcional: enviar de volta o termo usado para a UI
    ]
]);
exit;
?>