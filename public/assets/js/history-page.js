// public/assets/js/history-page.js

document.addEventListener('DOMContentLoaded', function () {
    const fullHistoryContainer = document.getElementById('fullHistoryContainer');
    const historySearchInput = document.getElementById('historySearchInput');
    const historySearchBtn = document.getElementById('historySearchBtn');

    let historyItemModalInstance;
    const historyItemModalElement = document.getElementById('historyItemModal');
    if (historyItemModalElement) {
        historyItemModalInstance = bootstrap.Modal.getInstance(historyItemModalElement) || new bootstrap.Modal(historyItemModalElement);
    }
    const historyItemModalBody = document.getElementById('historyItemModalBody');
    const modalCopyInputBtn = document.getElementById('modalCopyHistoryInputBtn');
    const modalCopyOutputBtn = document.getElementById('modalCopyHistoryOutputBtn');
    const modalEditBtn = document.getElementById('modalEditHistoryItemBtn');
    let currentViewingHistoryItemId = null;

    // Pega o token CSRF da página (do input hidden em history.php)
    const pageCsrfToken = document.getElementById('csrf_token_history_page')?.value;

    let currentPage = 1;
    const itemsPerPage = 10; 
    let currentSearchTerm = '';

    async function loadHistory(page = 1, searchTerm = '') {
        if (!fullHistoryContainer) return;
        showGlobalLoader(true);
        fullHistoryContainer.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div><p class="mt-3 text-muted">Carregando histórico...</p></div>';
        currentPage = page;
        currentSearchTerm = searchTerm.trim();

        try {
            const response = await axios.get('api/get_full_history.php', {
                params: {
                    page: currentPage,
                    perPage: itemsPerPage,
                    search: currentSearchTerm
                }
            });

            if (response.data.success) {
                if (response.data.history.length === 0) {
                    if (currentSearchTerm) {
                        fullHistoryContainer.innerHTML = '<div class="alert alert-warning text-center mt-3"><i class="fas fa-search me-2"></i>Nenhum item encontrado para sua busca por "<strong>' + sanitizeHTML(currentSearchTerm) + '</strong>".</div>';
                    } else {
                        fullHistoryContainer.innerHTML = '<div class="alert alert-info text-center mt-3"><i class="fas fa-folder-open me-2"></i>Seu histórico de prompts está vazio. Comece a gerar!</div>';
                    }
                    const existingNav = document.querySelector('nav.pagination-nav'); // Seleciona globalmente para remover
                    if (existingNav) existingNav.remove();
                } else {
                    renderHistoryTable(response.data.history);
                    renderPagination(response.data.pagination);
                }
            } else {
                fullHistoryContainer.innerHTML = `<div class="alert alert-danger mt-3">Erro: ${sanitizeHTML(response.data.error || 'Não foi possível carregar o histórico.')}</div>`;
            }
        } catch (error) {
            console.error("Erro ao carregar histórico:", error);
            fullHistoryContainer.innerHTML = '<div class="alert alert-danger mt-3">Falha na comunicação ao carregar o histórico. Tente novamente.</div>';
        } finally {
            showGlobalLoader(false);
        }
    }

    function renderHistoryTable(historyItems) {
        let tableHtml = `
            <div class="table-responsive shadow-sm rounded">
                <table class="table table-hover table-striped table-bordered mb-0">
                    <thead class="table-light">
                        <tr>
                            <th scope="col" style="width: 15%;">Data</th>
                            <th scope="col">Input (Preview)</th>
                            <th scope="col">Output (Preview)</th>
                            <th scope="col" class="text-end" style="width: 18%;">Ações</th>
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
                    <td class="align-middle small">${createdAt}</td>
                    <td class="align-middle" title="${sanitizeHTML(promptBasePreview)}">
                        <small>${sanitizeHTML(promptBasePreview.substring(0, 100))}${promptBasePreview.length > 100 ? '...' : ''}</small>
                    </td>
                    <td class="align-middle" title="${sanitizeHTML(item.generated_text_preview)}">
                         <small>${sanitizeHTML(item.generated_text_preview.substring(0, 120))}${item.generated_text_preview.length > 120 ? '...' : ''}</small>
                    </td>
                    <td class="text-end align-middle">
                        <button class="btn btn-sm btn-outline-info view-history-btn me-1" data-history-id="${item.id}" title="Visualizar Detalhes Completos">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning edit-history-item-btn me-1" data-history-id="${item.id}" title="Carregar no Dashboard para Editar e Re-gerar">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-history-btn" data-history-id="${item.id}" title="Excluir este Item">
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
        const existingNav = document.querySelector('nav.pagination-nav'); // Seleciona globalmente
        if (existingNav) existingNav.remove();

        if (paginationData.totalPages <= 1) {
            return;
        }

        let paginationHtml = `<nav aria-label="Histórico paginação" class="mt-4 d-flex justify-content-center pagination-nav">
                                <ul class="pagination shadow-sm">`;
        // ... (lógica de paginação como antes, sem mudanças significativas aqui) ...
        // Botão Anterior
        paginationHtml += `<li class="page-item ${paginationData.currentPage === 1 ? 'disabled' : ''}">
                                <a class="page-link" href="#" data-page="${paginationData.currentPage - 1}" aria-label="Anterior">
                                    <span aria-hidden="true">«</span>
                                </a>
                           </li>`;
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
        
        // Adiciona a nova paginação após o container da tabela (ou do alerta se não houver itens)
        const containerParent = fullHistoryContainer.parentNode;
        containerParent.insertAdjacentHTML('beforeend', paginationHtml);
    }

    // Event listener para cliques nos links de paginação (agora escuta no document para pegar a nav que está fora do fullHistoryContainer)
    document.addEventListener('click', function (event) {
        const pageLink = event.target.closest('.pagination-nav .page-link');
        if (pageLink) {
            event.preventDefault();
            const pageTarget = parseInt(pageLink.dataset.page);
            if (pageTarget && pageTarget !== currentPage && !pageLink.closest('.page-item.disabled')) {
                loadHistory(pageTarget, currentSearchTerm);
            }
        }
    });

    if (historySearchBtn && historySearchInput) {
        historySearchBtn.addEventListener('click', function () {
            loadHistory(1, historySearchInput.value);
        });
        historySearchInput.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                loadHistory(1, historySearchInput.value);
            }
        });
    }

    if (fullHistoryContainer) {
        fullHistoryContainer.addEventListener('click', async function (event) {
            const viewButton = event.target.closest('.view-history-btn');
            const editButton = event.target.closest('.edit-history-item-btn');
            const deleteButton = event.target.closest('.delete-history-btn');

            if (viewButton) {
                currentViewingHistoryItemId = viewButton.dataset.historyId;
                if (historyItemModalBody) historyItemModalBody.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div><p class="mt-3 text-muted">Carregando detalhes...</p></div>';
                if (modalEditBtn) modalEditBtn.dataset.historyId = currentViewingHistoryItemId; // Passa o ID para o botão de editar do modal
                if (historyItemModalInstance) historyItemModalInstance.show();
                
                try {
                    const response = await axios.get(`api/get_history_item.php?id=${currentViewingHistoryItemId}`);
                    if (response.data.success && response.data.item) {
                        renderHistoryItemModalContent(response.data.item);
                    } else {
                        if (historyItemModalBody) historyItemModalBody.innerHTML = `<div class="alert alert-danger">${sanitizeHTML(response.data.error || 'Erro ao carregar item.')}</div>`;
                    }
                } catch (error) {
                    console.error("Erro ao buscar item do histórico:", error);
                    if (historyItemModalBody) historyItemModalBody.innerHTML = `<div class="alert alert-danger">Falha na comunicação ao buscar detalhes.</div>`;
                }
            }

            if (editButton) {
                const historyId = editButton.dataset.historyId;
                localStorage.setItem('editHistoryItemId', historyId);
                window.location.href = 'dashboard.php#editHistory'; 
            }

            if (deleteButton) {
                const historyId = deleteButton.dataset.historyId;
                Swal.fire({
                    title: 'Confirmar Exclusão',
                    text: "Tem certeza que deseja excluir este item do histórico? Esta ação não pode ser desfeita.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Sim, excluir!',
                    cancelButtonText: 'Cancelar',
                    customClass: { popup: 'shadow-lg' }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        showGlobalLoader(true);
                        if (!pageCsrfToken) {
                            showGlobalAlert('error', 'Erro de Segurança', 'Token de validação não encontrado na página. Recarregue e tente novamente.');
                            showGlobalLoader(false);
                            return;
                        }
                        try {
                            const response = await axios.post('api/delete_history_item.php', { 
                                id: historyId, 
                                csrf_token: pageCsrfToken 
                            });
                            if (response.data.success) {
                                showGlobalToast('success', 'Item do histórico excluído.');
                                loadHistory(currentPage, currentSearchTerm); 
                            } else {
                                showGlobalAlert('error', 'Erro ao Excluir', sanitizeHTML(response.data.error || 'Não foi possível excluir o item.'));
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
    }
    
    function renderHistoryItemModalContent(item) {
        if (!historyItemModalBody) return;
        const inputParams = JSON.parse(item.input_parameters || '{}');
        // const geminiParams = JSON.parse(item.gemini_parameters_used || '{}'); // Se for usar

        let html = `
            <h4><i class="fas fa-file-alt me-2 text-primary"></i>Prompt Enviado à IA:</h4>
            <pre class="bg-light p-3 border rounded mb-3" style="font-size:0.9em; max-height: 200px; overflow-y: auto;">${sanitizeHTML(inputParams.final_prompt_text || inputParams.raw_prompt_text || 'N/A')}</pre>
            
            <h4><i class="fas fa-robot me-2 text-success"></i>Resultado Gerado:</h4>
            <pre class="bg-light p-3 border rounded mb-3" style="font-size:0.9em; max-height: 300px; overflow-y: auto;">${sanitizeHTML(item.generated_text)}</pre>
            
            <hr class="my-4">
            
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fas fa-cogs me-2 text-secondary"></i>Detalhes do Input Original:</h6>
                    <ul class="list-unstyled small">
                        <li><strong>Prompt Base/Estrutura:</strong> 
                            <div class="ms-2 p-2 bg-white border rounded" style="font-size:0.9em; white-space:pre-wrap; max-height: 150px; overflow-y:auto;">${sanitizeHTML(inputParams.raw_prompt_text || 'N/A')}</div>
                        </li>
                        ${inputParams.template_id_used ? `<li class="mt-2"><strong>Template Usado (ID):</strong> ${sanitizeHTML(inputParams.template_id_used)}</li>` : ''}
                    `;
        if (inputParams.template_custom_values && Object.keys(inputParams.template_custom_values).length > 0) {
            html += '<li class="mt-2"><strong>Valores dos Campos do Template:</strong><ul class="list-unstyled ms-3">';
            for (const key in inputParams.template_custom_values) {
                html += `<li><strong>${sanitizeHTML(key)}:</strong> <span class="text-break">${sanitizeHTML(inputParams.template_custom_values[key])}</span></li>`;
            }
            html += '</ul></li>';
        }
        html += `</ul></div>`; // Fim col-md-6

        html += `<div class="col-md-6">
                    <h6><i class="fas fa-sliders-h me-2 text-secondary"></i>Parâmetros da Geração:</h6>
                    <ul class="list-unstyled small">`;
        const userGenSettings = inputParams.generation_settings_input || {};
        const apiGenSettings = JSON.parse(item.gemini_parameters_used || '{}'); // Parâmetros realmente usados pela API
        html += `<li><strong>Temperatura:</strong> ${sanitizeHTML(userGenSettings.temperature ?? (apiGenSettings.temperature ?? 'Padrão API'))}</li>`;
        html += `<li><strong>Max Tokens de Saída:</strong> ${sanitizeHTML(userGenSettings.maxOutputTokens ?? (apiGenSettings.maxOutputTokens ?? 'Padrão API'))}</li>`;
        // Adicionar topK, topP se forem logados
        html += `</ul>`;

        if(item.token_count_prompt || item.token_count_response) {
            html += `<h6 class="mt-3"><i class="fas fa-calculator me-2 text-secondary"></i>Contagem de Tokens (API):</h6><ul class="list-unstyled small">`;
            if(item.token_count_prompt) html += `<li><strong>Tokens do Prompt:</strong> ${item.token_count_prompt}</li>`;
            if(item.token_count_response) html += `<li><strong>Tokens da Resposta:</strong> ${item.token_count_response}</li>`;
            html += `</ul>`;
        }
        html += `</div></div>`; // Fim row

        html += `<p class="mt-4 text-center"><small class="text-muted">Gerado em: ${new Date(item.created_at).toLocaleString('pt-BR')}</small></p>`;
        historyItemModalBody.innerHTML = html;
    }

    if(modalCopyInputBtn) {
        modalCopyInputBtn.addEventListener('click', () => {
            const inputPres = historyItemModalBody.querySelectorAll('pre');
            if (inputPres.length > 0 && inputPres[0].textContent) { // Primeiro <pre> é o prompt enviado
                navigator.clipboard.writeText(inputPres[0].textContent)
                    .then(() => showGlobalToast('success', 'Prompt enviado à IA copiado!'))
                    .catch(err => showGlobalAlert('error', 'Falha ao Copiar', 'Não foi possível copiar.'));
            }
        });
    }
    if(modalCopyOutputBtn) {
         modalCopyOutputBtn.addEventListener('click', () => {
            const outputPres = historyItemModalBody.querySelectorAll('pre');
            if (outputPres.length > 1 && outputPres[1].textContent) { // Segundo <pre> é o resultado gerado
                navigator.clipboard.writeText(outputPres[1].textContent)
                    .then(() => showGlobalToast('success', 'Resultado gerado copiado!'))
                    .catch(err => showGlobalAlert('error', 'Falha ao Copiar', 'Não foi possível copiar.'));
            }
        });
    }
    
    if(modalEditBtn){
        modalEditBtn.addEventListener('click', function(){
            const historyIdToEdit = this.dataset.historyId || currentViewingHistoryItemId; // Pega o ID do botão ou do estado
            if(historyIdToEdit){
                localStorage.setItem('editHistoryItemId', historyIdToEdit);
                if(historyItemModalInstance) historyItemModalInstance.hide();
                window.location.href = 'dashboard.php#editHistory';
            } else {
                showGlobalToast('warning', 'ID do item não encontrado para edição.');
            }
        });
    }
    
    // Delegação para botões de exportação no modal de histórico
    if (historyItemModalElement) {
        historyItemModalElement.addEventListener('click', function(event) {
            const exportBtn = event.target.closest('.export-single-history-btn');
            if (exportBtn && currentViewingHistoryItemId) {
                event.preventDefault();
                const format = exportBtn.dataset.format;
                // Adapte o dataType se necessário no export_data.php
                window.location.href = `api/export_data.php?type=history_single&itemId=${currentViewingHistoryItemId}&format=${format}`;
            }
        });
    }


    loadHistory();

}); // Fim do DOMContentLoaded