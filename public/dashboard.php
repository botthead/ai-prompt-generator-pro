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
$historyItems = $promptService->getHistoryForUser($userId, 5); // Pega os 5 mais recentes

// Buscar templates do usuário para o dropdown
$userTemplates = $templateManager->getTemplatesByUser($userId);

$csrfToken = Auth::generateCsrfToken(); // Para o formulário de geração principal
?>

<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Dashboard</h1>
    <div class="btn-toolbar mb-2 mb-md-0">
        <button type="button" class="btn btn-sm btn-outline-primary me-2" data-bs-toggle="modal" data-bs-target="#aiAssistanceModal">
            <i class="fas fa-magic me-1"></i> Assistente de Prompt IA
        </button>
        <a href="templates.php" class="btn btn-sm btn-outline-secondary">
            <i class="fas fa-file-alt me-1"></i> Gerenciar Templates
        </a>
    </div>
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
                    <input type="hidden" name="csrf_token_generate" value="<?php echo htmlspecialchars($csrfToken); ?>">
                    
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
                        <label for="prompt_main_text" class="form-label">Seu Prompt Base (ou estrutura do template):<span class="text-danger">*</span></label>
                        <!-- Para V1, um textarea. CKEditor pode ser adicionado depois. -->
                        <textarea class="form-control" id="prompt_main_text" name="prompt_main_text" rows="8" placeholder="Descreva o que você quer que a IA gere. Use {{placeholders}} se estiver usando um template." required></textarea>
                        <!-- Se usar CKEditor: <div id="prompt_main_text_editor"></div> -->
                        <small class="form-text text-muted">Se selecionou um template, a estrutura aparecerá aqui. Preencha os campos acima se o template os solicitar.</small>
                    </div>

                    <h5 class="mt-4 mb-3">Parâmetros da Geração (Opcional)</h5>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="temperature" class="form-label">Temperatura (Criatividade): <span id="tempValueDisplay" class="badge bg-secondary">0.7</span></label>
                            <input type="range" class="form-range" id="temperature" name="temperature" min="0" max="2" step="0.1" value="0.7">
                            <small class="form-text text-muted">Valores mais altos = mais criativo/aleatório. Padrão Gemini: 0.9-1.0 para Flash, pode variar.</small>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="maxOutputTokens" class="form-label">Máx. Tokens de Saída:</label>
                            <input type="number" class="form-control form-control-sm" id="maxOutputTokens" name="maxOutputTokens" min="10" max="8192" value="1024" placeholder="Ex: 1024">
                        </div>
                        <!-- Adicionar Top-K, Top-P se desejar -->
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-lg w-100" id="generatePromptBtn">
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
                <div id="generatedResultOutput" class="p-2" style="min-height: 150px; white-space: pre-wrap; word-wrap: break-word; font-family: 'Roboto Mono', monospace; background-color: #f8f9fa; border-radius: 0.375rem; border: 1px solid #dee2e6; max-height: 500px; overflow-y: auto;">
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
            <div class="card-body" id="recentHistoryContainer" style="max-height: 600px; overflow-y: auto;">
                <?php if (empty($historyItems)): ?>
                    <p class="text-muted text-center mt-3">Nenhum prompt gerado ainda.</p>
                <?php else: ?>
                    <ul class="list-group list-group-flush">
                        <?php foreach ($historyItems as $item):
                            $inputData = json_decode($item['input_parameters'], true);
                            $promptBasePreview = $inputData['prompt_base'] ?? ($inputData['raw_prompt_text'] ?? 'N/A');
                        ?>
                            <li class="list-group-item history-item">
                                <div class="d-flex w-100 justify-content-between">
                                    <small class="text-muted">
                                        <i class="fas fa-calendar-alt me-1"></i><?php echo date('d/m/Y H:i', strtotime($item['created_at'])); ?>
                                    </small>
                                    <div>
                                        <button class="btn btn-sm btn-outline-info view-history-btn" data-history-id="<?php echo $item['id']; ?>" title="Visualizar Detalhes">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger delete-history-btn" data-history-id="<?php echo $item['id']; ?>" title="Excluir">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                                <p class="mb-1 mt-1">
                                    <strong>Input:</strong> <?php echo htmlspecialchars(mb_substr($promptBasePreview, 0, 70)); ?>...
                                </p>
                                <p class="mb-0 text-break">
                                    <small><strong>Output:</strong> <?php echo htmlspecialchars(mb_substr($item['generated_text_preview'], 0, 100)); ?>...</small>
                                </p>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                <?php endif; ?>
            </div>
            <?php if (!empty($historyItems)): ?>
            <div class="card-footer text-center">
                <a href="history.php" class="btn btn-sm btn-outline-primary">Ver Histórico Completo</a>
            </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- Modal para Assistência IA (estrutura básica) -->
<div class="modal fade" id="aiAssistanceModal" tabindex="-1" aria-labelledby="aiAssistanceModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="aiAssistanceModalLabel"><i class="fas fa-magic me-2"></i>Assistente de Prompt IA</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label for="aiActionType" class="form-label">Que tipo de assistência você precisa?</label>
                    <select class="form-select" id="aiActionType">
                        <option value="">-- Selecione uma Ação --</option>
                        <option value="analyze_prompt">Analisar meu prompt atual</option>
                        <option value="suggest_variations">Sugerir variações do meu prompt</option>
                        <option value="expand_idea">Expandir uma ideia curta para um prompt</option>
                        <option value="simplify_prompt">Simplificar meu prompt atual</option>
                        <option value="change_tone">Alterar o tom do meu prompt</option>
                    </select>
                </div>
                <div id="aiAssistantInputArea" class="mb-3 d-none">
                    <label for="aiAssistantUserInput" class="form-label" id="aiAssistantUserInputLabel">Sua Ideia/Texto:</label>
                    <textarea class="form-control" id="aiAssistantUserInput" rows="3"></textarea>
                    <div id="aiAssistantToneSelectorArea" class="mt-2 d-none">
                         <label for="aiAssistantNewTone" class="form-label">Selecione o Novo Tom:</label>
                         <select class="form-select" id="aiAssistantNewTone">
                             <option value="formal">Formal</option>
                             <option value="informal">Informal</option>
                             <option value="criativo">Criativo</option>
                             <option value="persuasivo">Persuasivo</option>
                             <option value="tecnico">Técnico</option>
                             <option value="entusiasmado">Entusiasmado</option>
                         </select>
                    </div>
                </div>
                 <div class="mb-3">
                    <label for="aiSuggestionCount" class="form-label">Número de sugestões (se aplicável):</label>
                    <input type="number" class="form-control form-control-sm" id="aiSuggestionCount" value="3" min="1" max="5" style="width: 80px;">
                </div>
                <button type="button" class="btn btn-info" id="runAiAssistantBtn">
                    <span class="spinner-border spinner-border-sm d-none me-1" role="status" aria-hidden="true"></span>
                    <i class="fas fa-play me-1"></i>Executar Assistência
                </button>
                <hr>
                <h6>Resultado da Assistência:</h6>
                <div id="aiAssistantResultOutput" class="p-2" style="min-height: 100px; white-space: pre-wrap; word-wrap: break-word; background-color: #e9ecef; border-radius: 0.25rem;">
                    <!-- Resultado da assistência IA aqui -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                <button type="button" class="btn btn-success d-none" id="applyAiAssistantResultBtn"><i class="fas fa-check me-1"></i>Aplicar ao Prompt</button>
            </div>
        </div>
    </div>
</div>

<!-- Modal para Visualizar Item do Histórico -->
<div class="modal fade" id="historyItemModal" tabindex="-1" aria-labelledby="historyItemModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="historyItemModalLabel">Detalhes do Prompt Gerado</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="historyItemModalBody">
                <!-- Conteúdo carregado via AJAX -->
                <div class="text-center"><div class="spinner-border text-primary" role="status"></div></div>
            </div>
            <div class="modal-footer">
                 <button type="button" class="btn btn-outline-primary" id="copyHistoryInputBtn"><i class="fas fa-copy"></i> Copiar Input</button>
                 <button type="button" class="btn btn-primary" id="copyHistoryOutputBtn"><i class="fas fa-copy"></i> Copiar Output</button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
            </div>
        </div>
    </div>
</div>


<?php
// Script específico para o dashboard
$pageScripts = ['dashboard-main.js']; // Vamos criar este arquivo
require_once __DIR__ . '/../src/Templates/footer.php';
?> 
