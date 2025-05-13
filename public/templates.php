<?php
$pageTitle = "Meus Templates de Prompt";
require_once __DIR__ . '/../src/Templates/header.php';
require_once __DIR__ . '/../src/Core/Auth.php';
require_once __DIR__ . '/../src/Core/TemplateManager.php';

$auth = new Auth();
$auth->requireLogin();

$userId = $auth->getUserId();
$templateManager = new TemplateManager();
$userTemplates = $templateManager->getTemplatesByUser($userId);

$csrfToken = Auth::generateCsrfToken(); // Para formulários de criação/edição
?>

<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Meus Templates de Prompt</h1>
    <div class="btn-toolbar mb-2 mb-md-0">
        <button type="button" class="btn btn-success" data-bs-toggle="modal" data-bs-target="#templateFormModal" id="openCreateTemplateModalBtn">
            <i class="fas fa-plus-circle me-1"></i> Criar Novo Template
        </button>
    </div>
</div>

<?php if (empty($userTemplates)): ?>
    <div class="alert alert-info text-center">
        <i class="fas fa-info-circle fa-2x mb-3"></i><br>
        Você ainda não criou nenhum template.<br>
        Templates ajudam a agilizar a criação de prompts repetitivos ou complexos. Clique em "Criar Novo Template" para começar!
    </div>
<?php else: ?>
    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4" id="templatesListContainer">
        <?php foreach ($userTemplates as $template): ?>
            <div class="col template-item-<?php echo htmlspecialchars($template['id']); ?>">
                <div class="card h-100 shadow-sm template-card">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title"><?php echo htmlspecialchars($template['name']); ?></h5>
                        <p class="card-text text-muted small flex-grow-1">
                            <?php echo nl2br(htmlspecialchars(mb_substr($template['description'] ?? 'Sem descrição.', 0, 150))); ?>
                            <?php if (mb_strlen($template['description'] ?? '') > 150) echo '...'; ?>
                        </p>
                        <div class="mt-auto pt-2 border-top">
                            <button class="btn btn-sm btn-primary use-template-btn" data-template-id="<?php echo htmlspecialchars($template['id']); ?>" title="Usar este template no Dashboard">
                                <i class="fas fa-rocket"></i> Usar
                            </button>
                            <button class="btn btn-sm btn-outline-secondary edit-template-btn ms-1" data-template-id="<?php echo htmlspecialchars($template['id']); ?>" title="Editar Template">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-template-btn ms-1" data-template-id="<?php echo htmlspecialchars($template['id']); ?>" title="Excluir Template">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
<?php endif; ?>

<!-- Modal para Criar/Editar Template -->
<div class="modal fade" id="templateFormModal" tabindex="-1" aria-labelledby="templateFormModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
            <form id="templateForm">
                <input type="hidden" name="csrf_token_template_form" value="<?php echo htmlspecialchars($csrfToken); ?>">
                <input type="hidden" name="template_id" id="template_id" value="">
                <div class="modal-header">
                    <h5 class="modal-title" id="templateFormModalLabel">Criar Novo Template</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="template_name" class="form-label">Nome do Template<span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="template_name" name="template_name" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="template_description" class="form-label">Descrição (Opcional)</label>
                            <textarea class="form-control" id="template_description" name="template_description" rows="1"></textarea>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="template_structure" class="form-label">Estrutura do Prompt (Corpo do Template)<span class="text-danger">*</span></label>
                        <textarea class="form-control" id="template_structure" name="template_structure" rows="7" placeholder="Ex: Gere um {{tipo_texto}} sobre {{assunto}} para um público {{publico_alvo}} com um tom {{tom_voz}}." required></textarea>
                        <small class="form-text text-muted">Use placeholders como <code>{{nome_do_placeholder}}</code>. Eles serão substituídos pelos valores dos campos personalizados que você definir abaixo.</small>
                    </div>

                    <hr>
                    <h6 class="mb-3">Campos Personalizados (Placeholders) <button type="button" class="btn btn-sm btn-outline-success float-end" id="addCustomFieldBtn"><i class="fas fa-plus"></i> Adicionar Campo</button></h6>
                    <div id="customFieldsDefinitionContainer">
                        <!-- Campos para definir os placeholders serão adicionados aqui via JS -->
                    </div>
                     <small class="form-text text-muted">Defina os placeholders que você usou na "Estrutura do Prompt" acima. O "Nome do Placeholder" deve ser idêntico ao usado na estrutura (sem as chaves <code>{{}}</code>).</small>

                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary" id="saveTemplateBtn">
                        <span class="spinner-border spinner-border-sm d-none me-1" role="status" aria-hidden="true"></span>
                        <i class="fas fa-save me-1"></i>Salvar Template
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>


<?php
// Script específico para a página de templates
$pageScripts = ['templates-manager.js']; // Vamos criar este arquivo
require_once __DIR__ . '/../src/Templates/footer.php';
?>