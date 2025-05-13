    <!-- Em public/history.php -->
    <!-- ... (código anterior, título, busca, container do histórico) ... -->

    <!-- Modal para Visualizar Item do Histórico (ATUALIZADO com opção Markdown no Exportar) -->
    <div class="modal fade" id="historyItemModal" tabindex="-1" aria-labelledby="historyItemModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content shadow-lg">
                <div class="modal-header bg-light">
                    <h5 class="modal-title" id="historyItemModalLabel"><i class="fas fa-info-circle me-2 text-primary"></i>Detalhes do Prompt Gerado</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="historyItemModalBody" style="font-size: 0.95rem;">
                    <!-- Conteúdo carregado via AJAX -->
                    <div class="text-center p-5"><div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div><p class="mt-3 text-muted">Carregando...</p></div>
                </div>
                <div class="modal-footer justify-content-between">
                    <div> <!-- Botões de exportação à esquerda -->
                        <div class="dropdown">
                            <button class="btn btn-outline-success btn-sm dropdown-toggle" type="button" id="exportHistoryItemDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="fas fa-download me-1"></i> Exportar Item
                            </button>
                            <ul class="dropdown-menu" aria-labelledby="exportHistoryItemDropdown">
                                <li><a class="dropdown-item export-single-history-btn-modal" href="#" data-format="json"><i class="fas fa-file-code fa-fw me-2"></i>JSON</a></li>
                                <li><a class="dropdown-item export-single-history-btn-modal" href="#" data-format="txt"><i class="fas fa-file-alt fa-fw me-2"></i>TXT</a></li>
                                <li><a class="dropdown-item export-single-history-btn-modal" href="#" data-format="md"><i class="fab fa-markdown fa-fw me-2"></i>Markdown</a></li>
                            </ul>
                        </div>
                    </div>
                    <div> <!-- Botões de ação à direita -->
                        <button type="button" class="btn btn-outline-primary btn-sm" id="modalCopyHistoryInputBtn" title="Copiar Input Original (Prompt enviado à IA)"><i class="fas fa-paste me-1"></i>Input</button>
                        <button type="button" class="btn btn-primary btn-sm" id="modalCopyHistoryOutputBtn" title="Copiar Resultado Gerado pela IA"><i class="fas fa-copy me-1"></i>Output</button>
                        <button type="button" class="btn btn-warning btn-sm" id="modalEditHistoryItemBtn" title="Carregar este item no dashboard para edição e nova geração"><i class="fas fa-pencil-alt me-1"></i>Editar</button>
                        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <?php
    $pageScripts = ['history-page.js'];
    require_once __DIR__ . '/../src/Templates/footer.php';
    ?>