// public/assets/js/history-page.js

document.addEventListener('DOMContentLoaded', function () {
    const fullHistoryContainer = document.getElementById('fullHistoryContainer');
    const historySearchInput = document.getElementById('historySearchInput');
    const historySearchBtn = document.getElementById('historySearchBtn');

    // Modal de visualização (já instanciado no dashboard-main.js se incluído, mas podemos re-instanciar ou pegar a instância)
    // Por segurança, vamos instanciar novamente se não existir.
    let historyItemModalInstance;
    const historyItemModalElement = document.getElementById('historyItemModal');
    if (historyItemModalElement) {
        historyItemModalInstance = bootstrap.Modal.getInstance(historyItemModalElement) || new bootstrap.Modal(historyItemModalElement);
    }
    const historyItemModalBody = document.getElementById('historyItemModalBody');
    const modalCopyInputBtn = document.getElementById('modalCopyHistoryInputBtn');
    const modalCopyOutputBtn = document.getElementById('modalCopyHistoryOutputBtn');
    const modalEditBtn = document.getElementById('modalEditHistoryItemBtn'); // Botão para editar/re-gerar
    let currentViewingHistoryItemId = null; // Para saber qual item está no modal


    let currentPage = 1;
    const itemsPerPage = 10; // Ou pegue de um select se quiser que o usuário defina
    let currentSearchTerm = '';
    // O token CSRF da página (do history.php) para ações de delete
    const pageCsrfToken = document.querySelector('input[name="csrf_token_generate"]')?.value || // Do dashboard, se for o mesmo
                           document.querySelector('input[name="csrf_token"]')?.value; // Ou um campo csrf_token genérico na página


    async function loadHistory(page = 1, searchTerm = '') {
        if (!fullHistoryContainer) return;
        showGlobalLoader(true);
        fullHistoryContainer.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Carregando histórico...</p></div>';
        currentPage = page;
        currentSearchTerm = searchTerm;

        try {
            const response = await axios.get('api/get_full_history.php', {
                params: {
                    page: currentPage,
                    perPage: itemsPerPage,
                    search: currentSearchTerm
                }
            });

            if (response.data.success) {
                renderHistoryTable(response.data.history);
                renderPagination(response.data.pagination);
                if (response.data.history.length === 0 && currentSearchTerm) {
                     fullHistoryContainer.innerHTML = '<div class="alert alert-warning text-center">Nenhum item encontrado para sua busca.</div>';
                } else if (response.data.history.length === 0) {
                    fullHistoryContainer.innerHTML = '<div class="alert alert-info text-center">Seu histórico de prompts está vazio.</div>';
                }
            } else {
                fullHistoryContainer.innerHTML = `<div class="alert alert-danger">Erro: ${response.data.error || 'Não foi possível carregar o histórico.'}</div>`;
            }
        } catch (error) {
            console.error("Erro ao carregar histórico:", error);
            fullHistoryContainer.innerHTML = '<div class="alert alert-danger">Falha na comunicação ao carregar o histórico. Tente novamente.</div>';
        } finally {
            showGlobalLoader(false);
        }
    }

    function renderHistoryTable(historyItems) {
        if (historyItems.length === 0) return; // Mensagem de "nenhum item" já tratada em loadHistory

        let tableHtml = `
            <div class="table-responsive">
                <table class="table table-hover table-striped">
                    <thead class="table-light">
                        <tr>
                            <th>Data</th>
                            <th>Input (Preview)</th>
                            <th>Output (Preview)</th>
                            <th class="text-end">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        historyItems.forEach(item => {
            const inputData = JSON.parse(item.input_parameters || '{}');
            const promptBasePreview = inputData.final_prompt_text || inputData.raw_prompt_text || 'N/A';
            const createdAt = new Date(item.created_at).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            tableHtml += `
                <tr class="history-table-item" data-history-id="${item.id}">
                    <td class="align-middle"><small>${createdAt}</small></td>
                    <td class="align-middle" title="${sanitizeHTML(promptBasePreview)}">
                        ${sanitizeHTML(promptBasePreview.substring(0, 100))}${promptBasePreview.length > 100 ? '...' : ''}
                    </td>
                    <td class="align-middle" title="${sanitizeHTML(item.generated_text_preview)}">
                        ${sanitizeHTML(item.generated_text_preview.substring(0, 120))}${item.generated_text_preview.length > 120 ? '...' : ''}
                    </td>
                    <td class="text-end align-middle">
                        <button class="btn btn-sm btn-outline-info view-history-btn me-1" data-history-id="${item.id}" title="Visualizar Detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning edit-history-item-btn me-1" data-history-id="${item.id}" title="Editar e Re-gerar">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-history-btn" data-history-id="${item.id}" title="Excluir">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tableHtml += `
                    </tbody>
                </table>
            </div>
        `;
        fullHistoryContainer.innerHTML = tableHtml;
    }

    function renderPagination(paginationData) {
        if (paginationData.totalPages <= 1) {
            // Remove qualquer paginação existente se não for necessária
            const existingNav = fullHistoryContainer.querySelector('nav.pagination-nav');
            if (existingNav) existingNav.remove();
            return;
        }

        let paginationHtml = `<nav aria-label="Histórico paginação" class="mt-4 d-flex justify-content-center pagination-nav">
                                <ul class="pagination">`;

        // Botão Anterior
        paginationHtml += `<li class="page-item ${paginationData.currentPage === 1 ? 'disabled' : ''}">
                                <a class="page-link" href="#" data-page="${paginationData.currentPage - 1}" aria-label="Anterior">
                                    <span aria-hidden="true">«</span>
                                </a>
                           </li>`;

        // Links das Páginas (lógica para exibir um número razoável de links)
        const maxPagesToShow = 5;
        let startPage = Math.max(1, paginationData.currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(paginationData.totalPages, startPage + maxPagesToShow - 1);
        if(endPage - startPage + 1 < maxPagesToShow && startPage > 1){
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }


        if (startPage > 1) {
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
            if (startPage > 2) {
                paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `<li class="page-item ${i === paginationData.currentPage ? 'active' : ''}">
                                   <a class="page-link" href="#" data-page="${i}">${i}</a>
                               </li>`;
        }

        if (endPage < paginationData.totalPages) {
            if (endPage < paginationData.totalPages - 1) {
                paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${paginationData.totalPages}">${paginationData.totalPages}</a></li>`;
        }

        // Botão Próximo
        paginationHtml += `<li class="page-item ${paginationData.currentPage === paginationData.totalPages ? 'disabled' : ''}">
                                <a class="page-link" href="#" data-page="${paginationData.currentPage + 1}" aria-label="Próximo">
                                    <span aria-hidden="true">»</span>
                                </a>
                           </li>`;
        paginationHtml += `</ul></nav>`;
        
        // Remove paginação antiga antes de adicionar a nova
        const existingNav = fullHistoryContainer.querySelector('nav.pagination-nav');
        if (existingNav) existingNav.remove();
        
        fullHistoryContainer.insertAdjacentHTML('beforeend', paginationHtml);
    }

    // Event listener para cliques nos links de paginação
    fullHistoryContainer.addEventListener('click', function (event) {
        if (event.target.matches('.page-link') || event.target.closest('.page-link')) {
            event.preventDefault();
            const pageLink = event.target.matches('.page-link') ? event.target : event.target.closest('.page-link');
            const pageTarget = parseInt(pageLink.dataset.page);
            if (pageTarget && pageTarget !== currentPage) {
                loadHistory(pageTarget, currentSearchTerm);
            }
        }
    });

    // Busca
    if (historySearchBtn && historySearchInput) {
        historySearchBtn.addEventListener('click', function () {
            loadHistory(1, historySearchInput.value.trim());
        });
        historySearchInput.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                loadHistory(1, historySearchInput.value.trim());
            }
        });
    }

    // Ações nos itens do histórico (Visualizar, Editar, Excluir)
    fullHistoryContainer.addEventListener('click', async function (event) {
        const viewButton = event.target.closest('.view-history-btn');
        const editButton = event.target.closest('.edit-history-item-btn');
        const deleteButton = event.target.closest('.delete-history-btn');

        if (viewButton) {
            currentViewingHistoryItemId = viewButton.dataset.historyId;
            if (historyItemModalBody) historyItemModalBody.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Carregando detalhes...</p></div>';
            if (modalEditBtn) modalEditBtn.classList.add('d-none'); // Esconde o botão de editar do modal por padrão
            if (historyItemModalInstance) historyItemModalInstance.show();
            
            try {
                const response = await axios.get(`api/get_history_item.php?id=${currentViewingHistoryItemId}`);
                if (response.data.success && response.data.item) {
                    renderHistoryItemModalContent(response.data.item); // Função para renderizar no modal
                    if (modalEditBtn) modalEditBtn.classList.remove('d-none'); // Mostra o botão se carregou
                } else {
                    if (historyItemModalBody) historyItemModalBody.innerHTML = `<div class="alert alert-danger">${response.data.error || 'Erro ao carregar item.'}</div>`;
                }
            } catch (error) {
                console.error("Erro ao buscar item do histórico:", error);
                if (historyItemModalBody) historyItemModalBody.innerHTML = `<div class="alert alert-danger">Falha na comunicação ao buscar detalhes.</div>`;
            }
        }

        if (editButton) {
            const historyId = editButton.dataset.historyId;
            // Armazenar no localStorage para o dashboard pegar e preencher os campos
            localStorage.setItem('editHistoryItemId', historyId);
            window.location.href = 'dashboard.php#edit'; // Adiciona um hash para o JS do dashboard saber
        }

        if (deleteButton) {
            const historyId = deleteButton.dataset.historyId;
            Swal.fire({
                title: 'Confirmar Exclusão',
                text: "Tem certeza que deseja excluir este item do histórico?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sim, excluir!',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    showGlobalLoader(true);
                    try {
                        const response = await axios.post('api/delete_history_item.php', { 
                            id: historyId, 
                            csrf_token: pageCsrfToken // Enviar o token da página
                        });
                        if (response.data.success) {
                            showGlobalToast('success', 'Item do histórico excluído.');
                            loadHistory(currentPage, currentSearchTerm); // Recarrega a lista atual
                        } else {
                            showGlobalAlert('error', 'Erro ao Excluir', response.data.error || 'Não foi possível excluir o item.');
                        }
                    } catch (error) {
                        console.error("Erro ao excluir item do histórico:", error);
                        showGlobalAlert('error', 'Erro na Requisição', 'Falha de comunicação ao excluir.');
                    } finally {
                        showGlobalLoader(false);
                    }
                }
            });
        }
    });

    function renderHistoryItemModalContent(item) {
        if (!historyItemModalBody) return;
        const inputParams = JSON.parse(item.input_parameters || '{}');
        const geminiParams = JSON.parse(item.gemini_parameters_used || '{}');

        let html = `
            <h4><i class="fas fa-file-alt me-2"></i>Prompt Enviado à IA:</h4>
            <pre class="bg-light p-3 border rounded mb-3" style="font-size:0.9em; max-height: 200px; overflow-y: auto;">${sanitizeHTML(inputParams.final_prompt_text || inputParams.raw_prompt_text || 'N/A')}</pre>
            
            <h4><i class="fas fa-robot me-2"></i>Resultado Gerado:</h4>
            <pre class="bg-light p-3 border rounded mb-3" style="font-size:0.9em; max-height: 300px; overflow-y: auto;">${sanitizeHTML(item.generated_text)}</pre>
            
            <hr>
            <h6><i class="fas fa-cogs me-2"></i>Detalhes do Input Original:</h6>
            <ul class="list-unstyled small">
                <li><strong>Prompt Base/Estrutura:</strong> <div class="ms-2 p-1 bg-white border rounded" style="font-size:0.9em; white-space:pre-wrap;">${sanitizeHTML(inputParams.raw_prompt_text || 'N/A')}</div></li>
                ${inputParams.template_id_used ? `<li><strong>Template Usado (ID):</strong> ${sanitizeHTML(inputParams.template_id_used)}</li>` : ''}
            `;
        if (inputParams.template_custom_values && Object.keys(inputParams.template_custom_values).length > 0) {
            html += '<li><strong>Valores dos Campos do Template:</strong><ul class="list-unstyled ms-3">';
            for (const key in inputParams.template_custom_values) {
                html += `<li><strong>${sanitizeHTML(key)}:</strong> ${sanitizeHTML(inputParams.template_custom_values[key])}</li>`;
            }
            html += '</ul></li>';
        }
        html += `</ul>`;

        html += `<h6 class="mt-3"><i class="fas fa-sliders-h me-2"></i>Parâmetros da Geração (Configurados):</h6><ul class="list-unstyled small">`;
        const userGenSettings = inputParams.generation_settings_input || {};
        html += `<li><strong>Temperatura:</strong> ${sanitizeHTML(userGenSettings.temperature ?? (geminiParams.temperature ?? 'Padrão API'))}</li>`;
        html += `<li><strong>Max Tokens de Saída:</strong> ${sanitizeHTML(userGenSettings.maxOutputTokens ?? (geminiParams.maxOutputTokens ?? 'Padrão API'))}</li>`;
        // Adicionar outros parâmetros se existirem (topK, topP)
        html += `</ul>`;

        if(item.token_count_prompt || item.token_count_response) {
            html += `<h6 class="mt-3"><i class="fas fa-calculator me-2"></i>Contagem de Tokens (API):</h6><ul class="list-unstyled small">`;
            if(item.token_count_prompt) html += `<li><strong>Tokens do Prompt:</strong> ${item.token_count_prompt}</li>`;
            if(item.token_count_response) html += `<li><strong>Tokens da Resposta:</strong> ${item.token_count_response}</li>`;
            html += `</ul>`;
        }

        html += `<p class="mt-4"><small class="text-muted">Gerado em: ${new Date(item.created_at).toLocaleString('pt-BR')}</small></p>`;
        historyItemModalBody.innerHTML = html;
    }

    // Lógica para os botões de copiar dentro do modal
    if(modalCopyInputBtn) {
        modalCopyInputBtn.addEventListener('click', () => {
            const inputPre = historyItemModalBody.querySelectorAll('pre')[0]; // Assume que o primeiro <pre> é o input
            if (inputPre && inputPre.textContent) {
                navigator.clipboard.writeText(inputPre.textContent)
                    .then(() => showGlobalToast('success', 'Input copiado!'))
                    .catch(err => showGlobalAlert('error', 'Falha ao Copiar'));
            }
        });
    }
    if(modalCopyOutputBtn) {
         modalCopyOutputBtn.addEventListener('click', () => {
            const outputPre = historyItemModalBody.querySelectorAll('pre')[1]; // Assume que o segundo <pre> é o output
            if (outputPre && outputPre.textContent) {
                navigator.clipboard.writeText(outputPre.textContent)
                    .then(() => showGlobalToast('success', 'Output copiado!'))
                    .catch(err => showGlobalAlert('error', 'Falha ao Copiar'));
            }
        });
    }
    
    // Lógica para o botão "Editar e Re-gerar" do modal
    if(modalEditBtn){
        modalEditBtn.addEventListener('click', function(){
            if(currentViewingHistoryItemId){
                localStorage.setItem('editHistoryItemId', currentViewingHistoryItemId);
                if(historyItemModalInstance) historyItemModalInstance.hide();
                window.location.href = 'dashboard.php#editHistory'; // Hash diferente para clareza
            }
        });
    }


    // Carregar o histórico inicial
    loadHistory();

}); // Fim do DOMContentLoaded