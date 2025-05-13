<?php
$pageTitle = "Histórico de Prompts Gerados";
require_once __DIR__ . '/../src/Templates/header.php';
require_once __DIR__ . '/../src/Core/Auth.php';
// PromptService será chamado via API, não diretamente aqui para a lista inicial,
// mas poderia ser usado para contar total de itens para paginação se necessário no PHP.

$auth = new Auth();
$auth->requireLogin();

$userId = $auth->getUserId();
$csrfToken = Auth::generateCsrfToken(); // Para ações como deletar
?>

<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Histórico Completo de Prompts</h1>
    <div class="btn-toolbar mb-2 mb-md-0">
        <!-- Pode adicionar botões de exportação aqui no futuro -->
        <input type="text" class="form-control form-control-sm me-2" id="historySearchInput" placeholder="Buscar no histórico..." style="width: 250px;">
        <button class="btn btn-sm btn-outline-secondary" id="historySearchBtn"><i class="fas fa-search"></i> Buscar</button>
    </div>
</div>

<div id="fullHistoryContainer">
    <div class="text-center p-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2">Carregando histórico...</p>
    </div>
    <!-- Itens do histórico e paginação serão renderizados aqui pelo JS -->
</div>

<!-- Modal para Visualizar Item do Histórico (reutilizando a estrutura do dashboard) -->
<div class="modal fade" id="historyItemModal" tabindex="-1" aria-labelledby="historyItemModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="historyItemModalLabel">Detalhes do Prompt Gerado</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="historyItemModalBody">
                <!-- Conteúdo carregado via AJAX -->
            </div>
            <div class="modal-footer">
                 <button type="button" class="btn btn-outline-primary" id="modalCopyHistoryInputBtn"><i class="fas fa-copy"></i> Copiar Input</button>
                 <button type="button" class="btn btn-primary" id="modalCopyHistoryOutputBtn"><i class="fas fa-copy"></i> Copiar Output</button>
                 <button type="button" class="btn btn-warning d-none" id="modalEditHistoryItemBtn"><i class="fas fa-edit"></i> Editar e Re-gerar</button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
            </div>
        </div>
    </div>
</div>

<?php
// Script específico para a página de histórico
$pageScripts = ['history-page.js'];
require_once __DIR__ . '/../src/Templates/footer.php';
?>