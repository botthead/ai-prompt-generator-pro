    <!-- Em public/templates.php -->
    <!-- ... (código anterior, título, botão "Criar Novo Template") ... -->

    <?php if (empty($userTemplates)): ?>
        <!-- ... (mensagem de nenhum template como antes) ... -->
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
                            <div class="mt-auto pt-2 border-top d-flex justify-content-start align-items-center">
                                <button class="btn btn-sm btn-primary use-template-btn" data-template-id="<?php echo htmlspecialchars($template['id']); ?>" title="Usar este template no Dashboard">
                                    <i class="fas fa-rocket"></i> Usar
                                </button>
                                <button class="btn btn-sm btn-outline-secondary edit-template-btn ms-1" data-template-id="<?php echo htmlspecialchars($template['id']); ?>" title="Editar Template">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                                
                                <!-- DROPDOWN DE EXPORTAÇÃO ATUALIZADO -->
                                <div class="btn-group ms-1">
                                    <button type="button" class="btn btn-sm btn-outline-success dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" title="Exportar Template">
                                        <i class="fas fa-download"></i> <span class="d-none d-md-inline">Exportar</span>
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item export-template-btn" href="#" data-template-id="<?php echo htmlspecialchars($template['id']); ?>" data-format="json"><i class="fas fa-file-code fa-fw me-2"></i>JSON</a></li>
                                        <li><a class="dropdown-item export-template-btn" href="#" data-template-id="<?php echo htmlspecialchars($template['id']); ?>" data-format="txt"><i class="fas fa-file-alt fa-fw me-2"></i>TXT</a></li>
                                        <li><a class="dropdown-item export-template-btn" href="#" data-template-id="<?php echo htmlspecialchars($template['id']); ?>" data-format="md"><i class="fab fa-markdown fa-fw me-2"></i>Markdown</a></li>
                                    </ul>
                                </div>
                                <!-- FIM DO DROPDOWN DE EXPORTAÇÃO -->

                                <button class="btn btn-sm btn-outline-danger delete-template-btn ms-auto" data-template-id="<?php echo htmlspecialchars($template['id']); ?>" title="Excluir Template">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <!-- ... (Modal para Criar/Editar Template como antes) ... -->

    <?php
    $pageScripts = ['templates-manager.js']; 
    require_once __DIR__ . '/../src/Templates/footer.php';
    ?>