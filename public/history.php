<?php
$pageTitle = "Histórico de Prompts Gerados";
require_once __DIR__ . '/../src/Templates/header.php'; // Inclui cabeçalho, config e inicia sessão
require_once __DIR__ . '/../src/Core/Auth.php';
// PromptService será chamado via API para popular a lista, não diretamente aqui para a carga inicial.

$auth = new Auth();
$auth->requireLogin(); // Garante que o usuário esteja logado

$userId = $auth->getUserId();
// Gerar um token CSRF para ações nesta página (como deletar via AJAX)
$csrfTokenPage = Auth::generateCsrfToken(); 
?>

<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Histórico Completo de Prompts</h1>
    <div class="btn-toolbar mb-2 mb-md-0">
        <div class="input-group">
            <input type="text" class="form-control form-control-sm" id="historySearchInput" placeholder="Buscar no histórico..." style="width: 250px;" aria-label="Buscar no histórico">
            <button class="btn btn-sm btn-outline-secondary" type="button" id="historySearchBtn"><i class="fas fa-search"></i></button>
        </div>
    </div>
</div>

<!-- Input hidden para o token CSRF da página, usado pelo history-page.js -->
<input type="hidden" id="csrf_token_history_page" value="<?php echo htmlspecialchars($csrfTokenPage); ?>">

<div id="fullHistoryContainer">
    <div class="text-center p-5">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
        <p class="mt-3 text-muted">Carregando histórico...</p>
    </div>
    <!-- Itens do histórico e paginação serão renderizados aqui pelo JS -->
</div>

<!-- Modal para Visualizar Item do Histórico (estrutura similar ao do dashboard) -->
<div class="modal fade" id="historyItemModal" tabindex="-1" aria-labelledby="historyItemModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="historyItemModalLabel"><i class="fas fa-info-circle me-2"></i>Detalhes do Prompt Gerado</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="historyItemModalBody">
                <!-- Conteúdo carregado via AJAX -->
                <div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Carregando...</p></div>
            </div>
            <div class="modal-footer justify-content-between">
                <div> <!-- Botões de exportação à esquerda -->
                    <div class="dropdown">
                        <button class="btn btn-outline-success btn-sm dropdown-toggle" type="button" id="exportHistoryItemDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-download me-1"></i> Exportar Item
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="exportHistoryItemDropdown">
                            <li><a class="dropdown-item export-single-history-btn" href="#" data-format="json"><i class="fas fa-file-code fa-fw me-2"></i>JSON</a></li>
                            <li><a class="dropdown-item export-single-history-btn" href="#" data-format="txt"><i class="fas fa-file-alt fa-fw me-2"></i>TXT</a></li>
                            <!-- <li><a class="dropdown-item export-single-history-btn" href="#" data-format="md"><i class="fab fa-markdown fa-fw me-2"></i>Markdown (Em breve)</a></li> -->
                        </ul>
                    </div>
                </div>
                <div> <!-- Botões de ação à direita -->
                    <button type="button" class="btn btn-outline-primary btn-sm" id="modalCopyHistoryInputBtn" title="Copiar Input Original"><i class="fas fa-paste me-1"></i>Copiar Input</button>
                    <button type="button" class="btn btn-primary btn-sm" id="modalCopyHistoryOutputBtn" title="Copiar Resultado Gerado"><i class="fas fa-copy me-1"></i>Copiar Output</button>
                    <button type="button" class="btn btn-warning btn-sm" id="modalEditHistoryItemBtn" title="Carregar este item no dashboard para edição e nova geração"><i class="fas fa-pencil-alt me-1"></i>Editar e Re-gerar</button>
                    <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Fechar</button>
                </div>
            </div>
        </div>
    </div>
</div>

<?php
// Script específico para a página de histórico
$pageScripts = ['history-page.js']; // Certifique-se que o footer.php lida com isso
require_once __DIR__ . '/../src/Templates/footer.php';
?>