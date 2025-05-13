            <!-- Em public/profile.php -->
            <!-- ... (outros cards como Informações Pessoais, Chave API) ... -->
            
            <!-- SEÇÃO DE EXPORTAÇÃO ATUALIZADA -->
            <div class="card mt-4 shadow-sm">
                <div class="card-header">
                    <h4><i class="fas fa-download me-2"></i>Exportar Meus Dados</h4>
                </div>
                <div class="card-body">
                    <p>Faça o download dos seus dados armazenados na plataforma.</p>
                    
                    <h6 class="mt-3 mb-2">Histórico Completo de Prompts:</h6>
                    <div class="btn-group mb-2" role="group" aria-label="Exportar Histórico">
                        <a href="api/export_data.php?type=history_all&format=json" class="btn btn-sm btn-outline-primary" download>
                            <i class="fas fa-file-code me-1"></i> JSON
                        </a>
                        <a href="api/export_data.php?type=history_all&format=txt" class="btn btn-sm btn-outline-secondary" download>
                            <i class="fas fa-file-alt me-1"></i> TXT
                        </a>
                        <a href="api/export_data.php?type=history_all&format=md" class="btn btn-sm btn-outline-dark" download>
                            <i class="fab fa-markdown me-1"></i> Markdown
                        </a>
                    </div>
                    
                    <hr class="my-3">
                    <p><small class="text-muted">A exportação de templates individuais e itens específicos do histórico pode ser feita nas respectivas páginas ("Meus Templates" e "Histórico Completo").</small></p>
                </div>
            </div>

        </div> <!-- Fecha col-lg-7 -->

        <div class="col-lg-5 col-md-12 mb-4">
            <!-- ... (Card de Alterar Senha como antes) ... -->
        </div>
    </div>

    <?php
    $pageScripts = ['auth.js']; 
    require_once __DIR__ . '/../src/Templates/footer.php';
    ?>