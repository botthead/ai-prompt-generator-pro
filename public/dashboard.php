<?php
$pageTitle = "Dashboard - Gerador de Prompts";
require_once __DIR__ . '/../src/Templates/header.php'; // Inclui cabeçalho, config e inicia sessão
require_once __DIR__ . '/../src/Core/Auth.php';
require_once __DIR__ . '/../src/Core/PromptService.php';
require_once __DIR__ . '/../src/Core/TemplateManager.php'; // Para carregar templates

$auth = new Auth();
$auth->requireLogin(); // Garante que o usuário esteja logado

$userId = $auth->getUserId();
$promptService = new PromptService();
$templateManager = new TemplateManager();

// Buscar histórico recente
// O método getHistoryForUser já retorna generated_text_preview e generated_text completo.
$historyItems = $promptService->getHistoryForUser($userId, 5, 0); 

// Buscar templates do usuário para o dropdown
$userTemplates = $templateManager->getTemplatesByUser($userId);

// Token CSRF para o formulário de geração principal (se não usar o global do Axios para este form específico)
// Se o Axios global está configurado com X-CSRF-TOKEN, este input hidden pode não ser necessário para a chamada AJAX.
// Mas, para formulários que podem ter um submit não-AJAX como fallback, é bom ter.
// $csrfTokenGenerateForm = Auth::generateCsrfToken(); 
?>

<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2"><i class="fas fa-tachometer-alt me-2"></i>Dashboard</h1>
    <div class="btn-toolbar mb-2 mb-md-0">
        <button type="button" class="btn btn-sm btn-outline-primary me-2" data-bs-toggle="modal" data-bs-target="#aiAssistanceModal">
            <i class="fas fa-magic me-1"></i> Assistente de Prompt IA
        </button>
        <a href="templates.php" class="btn btn-sm btn-outline-secondary me-2">
            <i class="fas fa-file-alt me-1"></i> Gerenciar Templates
        </a>
        <a href="history.php" class="btn btn-sm btn-outline-info">
            <i class="fas fa-history me-1"></i> Histórico Completo
        </a>
    </div>
</div>

<div id="apiKeyStatusIndicator" class="alert alert-info small py-2 mb-3 align-items-center justify-content-between" role="alert" style="display: none;">
    <span><i class="fas fa-key me-2"></i>Status da API Key Gemini: <strong id="apiKeyStatusText">Verificando...</strong></span>
    <a href="profile.php" class="alert-link ms-2 fw-bold" id="apiKeyConfigureLink" style="display:none;">Configurar Chave Agora</a>
</div>

<div class="row">
    <!-- Coluna Principal: Geração de Prompt -->
    <div class="col-lg-7 col-md-12 mb-4">
        <div class="card shadow-sm">
            <div class="card-header">
                <h4><i class="fas fa-lightbulb me-2"></i>Criar Novo Prompt</h4>
            </div>
            <div class="card-body">
                <form id="promptGenerationForm">
                    <!-- <input type="hidden" name="csrf_token_generate" value="<?php echo htmlspecialchars($csrfTokenGenerateForm); ?>"> -->
                    
                    <div class="mb-3">
                        <label for="promptTemplate" class="form-label">Usar Template:</label>
                        <select class="form-select" id="promptTemplate">
                            <option value="">-- Nenhum Template (Começar do Zero) --</option>
                            <?php foreach ($userTemplates as $template): ?>
                                <option value="<?php echo htmlspecialchars($template['id']); ?>">
                                    <?php echo htmlspecialchars($template['name']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div id="customTemplateFieldsContainer" class="mb-3">
                        <!-- Campos do template carregado via JS aparecerão aqui -->
                    </div>

                    <div class="mb-3">
                        <label for="prompt_main_text_editor_container" class="form-label">Seu Prompt Base (ou estrutura do template):<span class="text-danger">*</span></label>
                        <div id="prompt_main_text_editor_container">
                            <!-- CKEditor será instanciado aqui pelo JS -->
                        </div>
                        <textarea name="prompt_main_text_hidden" id="prompt_main_text_hidden" style="display:none;" required></textarea>
                        <small class="form-text text-muted mt-1">Se selecionou um template, a estrutura aparecerá aqui. Preencha os campos personalizados (se houver).</small>
                    </div>

                    <h5 class="mt-4 mb-3">Parâmetros da Geração (Opcional)</h5>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="temperature" class="form-label">
                                Temperatura (Criatividade): <span id="tempValueDisplay" class="badge bg-secondary">0.7</span>
                                <i class="fas fa-info-circle ms-1 text-muted" data-bs-toggle="tooltip" data-bs-placement="top" title="Controla a aleatoriedade. Valores mais altos (ex: 1.0-2.0) = mais criativo. Valores baixos (ex: 0.2) = mais focado. Padrão Gemini Flash: 0.9-1.0."></i>
                            </label>
                            <input type="range" class="form-range" id="temperature" name="temperature" min="0" max="2" step="0.1" value="0.7">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="maxOutputTokens" class="form-label">Máx. Tokens de Saída:</label>
                            <input type="number" class="form-control form-control-sm" id="maxOutputTokens" name="maxOutputTokens" min="50" max="8192" value="1024" placeholder="Ex: 1024">
                             <small class="form-text text-muted">Define o tamanho máximo da resposta.</small>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-lg w-100 mt-3" id="generatePromptBtn">
                        <span class="spinner-border spinner-border-sm d-none me-2" role="status" aria-hidden="true"></span>
                        <i class="fas fa-cogs me-2"></i>Gerar Prompt com IA
                    </button>
                </form>
            </div>
        </div>

        <div class="card mt-4 shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h4><i class="fas fa-robot me-2"></i>Resultado da IA</h4>
                <button class="btn btn-outline-secondary btn-sm d-none" id="copyResultBtn" title="Copiar Resultado">
                    <i class="fas fa-copy"></i> Copiar
                </button>
            </div>
            <div class="card-body">
                <div id="generatedResultOutput" class="p-3" style="min-height: 200px; white-space: pre-wrap; word-wrap: break-word; font-family: 'Roboto Mono', Menlo, Monaco, Consolas, 'Courier New', monospace; background-color: #f8f9fa; border-radius: 0.375rem; border: 1px solid #dee2e6; max-height: 500px; overflow-y: auto;">
                    <!-- O resultado aparecerá aqui... -->
                </div>
            </div>
        </div>
    </div>

    <!-- Coluna Lateral: Histórico Recente e Ações -->
    <div class="col-lg-5 col-md-12 mb-4">
        <div class="card shadow-sm">
            <div class="card-header">
                <h4><i class="fas fa-history me-2"></i>Histórico Recente</h4>
            </div>
            <div class="card-body p-0" id="recentHistoryContainer">
                <ul class="list-group list-group-flush">
                    <?php if (empty($historyItems)): ?>
                        <li class="list-group-item text-muted text-center p-4">Nenhum prompt gerado recentemente.</li>
                    <?php else: ?>
                        <?php foreach ($historyItems as $item):
                            $inputData = json_decode($item['input_parameters'], true);
                            $promptBasePreview = $inputData['final_prompt_text'] ?? ($inputData['raw_prompt_text'] ?? 'N/A');
                            $outputPreview = $item['generated_text_preview'] ?? ($item['generated_text'] ? mb_substr($item['generated_text'], 0, 100) . '...' : 'N/A');
                        ?>
                            <li class="list-group-item history-item p-2">
                                <div class="d-flex w-100 justify-content-between">
                                    <small class="text-muted">
                                        <i class="fas fa-calendar-alt me-1"></i><?php echo date('d/m/y H:i', strtotime($item['created_at'])); ?>
                                    </small>
                                    <div>
                                        <button class="btn btn-sm btn-outline-info view-history-btn py-0 px-1 me-1" data-history-id="<?php echo $item['id']; ?>" title="Visualizar Detalhes">
                                            <i class="fas fa-eye fa-xs"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger delete-history-btn py-0 px-1" data-history-id="<?php echo $item['id']; ?>" title="Excluir">
                                            <i class="fas fa-trash-alt fa-xs"></i>
                                        </button>
                                    </div>
                                </div>
                                <p class="mb-1 mt-1 small cursor-pointer view-history-btn" data-history-id="<?php echo $item['id']; ?>" title="<?php echo htmlspecialchars($promptBasePreview);?>">
                                    <strong>In:</strong> <?php echo htmlspecialchars(mb_substr($promptBasePreview, 0, 60)); ?><?php if(mb_strlen($promptBasePreview) > 60) echo '...'; ?>
                                </p>
                                <p class="mb-0 text-break small cursor-pointer view-history-btn" data-history-id="<?php echo $item['id']; ?>" title="<?php echo htmlspecialchars($item['generated_text']);?>">
                                    <small><strong>Out:</strong> <?php echo htmlspecialchars(mb_substr($outputPreview, 0, 80)); ?><?php if(mb_strlen($outputPreview) > 80) echo '...'; ?></small>
                                </p>
                            </li>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </ul>
            </div>
            <?php if (!empty($historyItems)): ?>
            <div class="card-footer text-center">
                <a href="history.php" class="btn btn-sm btn-outline-primary"><i class="fas fa-list-ul me-1"></i>Ver Histórico Completo</a>
            </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- Modal para Assistência IA (REFORMULADO) -->
<div class="modal fade" id="aiAssistanceModal" tabindex="-1" aria-labelledby="aiAssistanceModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title" id="aiAssistanceModalLabel"><i class="fas fa-magic fa-fw me-2"></i>Assistente Inteligente de Prompts</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4">
                <div class="row mb-3">
                    <div class="col-md-auto">
                        <label for="aiSuggestionCountModal" class="form-label fw-medium mb-0 pt-1">Sugestões por Ação:</label>
                    </div>
                    <div class="col-md-2">
                        <input type="number" class="form-control form-control-sm" id="aiSuggestionCountModal" value="3" min="1" max="5" style="width: 70px;" aria-describedby="aiSuggestionCountHelp">
                    </div>
                    <div class="col-md">
                        <small id="aiSuggestionCountHelp" class="form-text text-muted pt-1">Define o número de alternativas que a IA tentará gerar (quando aplicável).</small>
                    </div>
                </div>

                <p class="text-muted mb-3">Selecione uma ferramenta de IA para refinar ou gerar ideias para seu prompt:</p>
                
                <div id="aiAssistantActionsList" class="list-group list-group-flush mb-4">
                    <!-- Ações serão populadas aqui pelo JS -->
                </div>

                <div id="aiAssistantDynamicInputArea" class="mb-3 p-3 border rounded bg-light" style="display: none;">
                    <!-- Inputs dinâmicos (ex: textarea para "Expandir Ideia") aparecerão aqui -->
                </div>
                
                <button type="button" class="btn btn-info w-100 mb-3 shadow-sm" id="runAiAssistantBtn" style="display:none;">
                    <span class="spinner-border spinner-border-sm d-none me-2" role="status" aria-hidden="true"></span>
                    <i class="fas fa-cogs me-2"></i>Processar com IA
                </button>
                <hr class="my-4">

                <label for="aiAssistantResultOutput" class="form-label fw-semibold mt-2">Resultado da Assistência:</label>
                <div id="aiAssistantResultOutput" class="mt-1 p-3 border rounded bg-light" style="min-height: 150px; max-height: 350px; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word; font-family: 'Roboto Mono', Menlo, Monaco, Consolas, 'Courier New', monospace; font-size: 0.9em;">
                    Selecione uma ação da lista acima para começar.
                </div>
            </div>
            <div class="modal-footer justify-content-between">
                <div> <!-- Botões à esquerda -->
                    <button type="button" class="btn btn-success btn-sm d-none shadow-sm" id="applyAiAssistantResultBtn" title="Aplicar ao editor de prompt principal">
                        <i class="fas fa-check-circle me-2"></i>Aplicar ao Prompt Principal
                    </button>
                    <button type="button" class="btn btn-light btn-sm border d-none shadow-sm" id="copyAiAssistantResultBtn" title="Copiar resultado da assistência">
                        <i class="fas fa-copy me-2"></i>Copiar Resultado
                    </button>
                </div>
                <div> <!-- Botões à direita -->
                    <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal" id="aiCloseModalBtn">Fechar</button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal para Visualizar Item do Histórico (Mesmo modal usado pela página history.php) -->
<div class="modal fade" id="historyItemModal" tabindex="-1" aria-labelledby="historyItemModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="historyItemModalLabel"><i class="fas fa-info-circle me-2"></i>Detalhes do Prompt Gerado</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="historyItemModalBody">
                <div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Carregando...</p></div>
            </div>
            <div class="modal-footer justify-content-between">
                 <div>
                    <div class="dropdown">
                        <button class="btn btn-outline-success btn-sm dropdown-toggle" type="button" id="exportHistoryItemDropdownModal" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-download me-1"></i> Exportar Item
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="exportHistoryItemDropdownModal">
                            <li><a class="dropdown-item export-single-history-btn-modal" href="#" data-format="json"><i class="fas fa-file-code fa-fw me-2"></i>JSON</a></li>
                            <li><a class="dropdown-item export-single-history-btn-modal" href="#" data-format="txt"><i class="fas fa-file-alt fa-fw me-2"></i>TXT</a></li>
                        </ul>
                    </div>
                </div>
                <div>
                    <button type="button" class="btn btn-outline-primary btn-sm" id="modalCopyHistoryInputBtn" title="Copiar Input Original"><i class="fas fa-paste me-1"></i>Input</button>
                    <button type="button" class="btn btn-primary btn-sm" id="modalCopyHistoryOutputBtn" title="Copiar Resultado Gerado"><i class="fas fa-copy me-1"></i>Output</button>
                    <button type="button" class="btn btn-warning btn-sm" id="modalEditHistoryItemBtn" title="Carregar para Edição"><i class="fas fa-pencil-alt me-1"></i>Editar</button>
                    <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Fechar</button>
                </div>
            </div>
        </div>
    </div>
</div>

<?php
$pageScripts = ['dashboard-main.js'];
require_once __DIR__ . '/../src/Templates/footer.php';
?>