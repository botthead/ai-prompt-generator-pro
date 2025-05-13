// public/assets/js/dashboard-main.js

document.addEventListener('DOMContentLoaded', function () {
    // Elementos do Formulário Principal de Geração
    const promptGenerationForm = document.getElementById('promptGenerationForm');
    const promptTemplateSelect = document.getElementById('promptTemplate');
    const customTemplateFieldsContainer = document.getElementById('customTemplateFieldsContainer');
    const promptMainTextEditorContainer = document.getElementById('prompt_main_text_editor_container');
    const hiddenPromptTextarea = document.getElementById('prompt_main_text_hidden');
    let ckEditorPromptInstance;
    let mainPromptField = hiddenPromptTextarea; // Assume o textarea como fallback inicial

    const temperatureSlider = document.getElementById('temperature');
    const tempValueDisplay = document.getElementById('tempValueDisplay');
    const maxOutputTokensInput = document.getElementById('maxOutputTokens');
    const generatePromptBtn = document.getElementById('generatePromptBtn');
    const generateBtnSpinner = generatePromptBtn ? generatePromptBtn.querySelector('.spinner-border') : null;

    const generatedResultOutputDiv = document.getElementById('generatedResultOutput');
    const copyResultBtn = document.getElementById('copyResultBtn');

    const recentHistoryContainer = document.getElementById('recentHistoryContainer');
    const historyItemModalElementForDashboard = document.getElementById('historyItemModal');
    const historyItemModalInstanceForDashboard = historyItemModalElementForDashboard ? new bootstrap.Modal(historyItemModalElementForDashboard) : null;
    const historyItemModalBodyForDashboard = document.getElementById('historyItemModalBody');
    const modalCopyInputBtnDashboard = document.getElementById('modalCopyHistoryInputBtn');
    const modalCopyOutputBtnDashboard = document.getElementById('modalCopyHistoryOutputBtn');
    const modalEditBtnDashboard = document.getElementById('modalEditHistoryItemBtn');
    let currentViewingHistoryItemIdDashboard = null;

    const aiAssistanceModalElement = document.getElementById('aiAssistanceModal');
    const aiAssistanceModalInstance = aiAssistanceModalElement ? new bootstrap.Modal(aiAssistanceModalElement) : null;
    const aiAssistantActionsListDiv = document.getElementById('aiAssistantActionsList');
    const aiAssistantDynamicInputArea = document.getElementById('aiAssistantDynamicInputArea');
    const aiSuggestionCountInput = document.getElementById('aiSuggestionCountModal');
    const runAiAssistantBtn = document.getElementById('runAiAssistantBtn');
    const runAiAssistantBtnSpinner = runAiAssistantBtn ? runAiAssistantBtn.querySelector('.spinner-border') : null;
    const aiAssistantResultOutputDiv = document.getElementById('aiAssistantResultOutput');
    const applyAiAssistantResultBtn = document.getElementById('applyAiAssistantResultBtn');
    const copyAiAssistantResultBtn = document.getElementById('copyAiAssistantResultBtn');
    let currentAiAssistantOutput = "";
    let selectedAiAssistantAction = null;

    const apiKeyStatusIndicator = document.getElementById('apiKeyStatusIndicator');
    const apiKeyStatusText = document.getElementById('apiKeyStatusText');
    const apiKeyConfigureLink = document.getElementById('apiKeyConfigureLink');

    function initializeMainPromptFieldFallback() {
        if (hiddenPromptTextarea) {
            if (promptMainTextEditorContainer) promptMainTextEditorContainer.style.display = 'none';
            hiddenPromptTextarea.style.display = 'block';
            hiddenPromptTextarea.rows = 10;
            hiddenPromptTextarea.classList.add('form-control');
            hiddenPromptTextarea.placeholder = "O editor avançado não pôde ser carregado. Digite seu prompt aqui...";
            mainPromptField = hiddenPromptTextarea;
        } else {
            console.error("Textarea de fallback (prompt_main_text_hidden) não encontrado e CKEditor falhou!");
            if (promptGenerationForm && promptMainTextEditorContainer && !document.getElementById('prompt_main_text_dynamic_fallback')) {
                promptMainTextEditorContainer.innerHTML = ''; // Limpa o container
                const dynamicTextarea = document.createElement('textarea');
                dynamicTextarea.id = 'prompt_main_text_dynamic_fallback';
                dynamicTextarea.name = 'prompt_main_text';
                dynamicTextarea.className = 'form-control';
                dynamicTextarea.rows = 10;
                dynamicTextarea.placeholder = "Erro crítico: Campo de prompt não pôde ser carregado.";
                promptMainTextEditorContainer.parentNode.insertBefore(dynamicTextarea, promptMainTextEditorContainer.nextSibling);
                promptMainTextEditorContainer.style.display = 'none'; // Esconde o container original
                mainPromptField = dynamicTextarea;
            }
        }
    }

    if (promptMainTextEditorContainer && typeof ClassicEditor !== 'undefined') {
        ClassicEditor
            .create(promptMainTextEditorContainer, {
                toolbar: { items: ['undo', 'redo', '|', 'heading', '|', 'bold', 'italic', '|', 'link', '|', 'bulletedList', 'numberedList'], shouldNotGroupWhenFull: true },
                language: 'pt-br', placeholder: 'Descreva o que você quer que a IA gere. Use {{placeholders}} se estiver usando um template.',
            })
            .then(editor => {
                ckEditorPromptInstance = editor; mainPromptField = editor;
                console.log('CKEditor inicializado.');
                if (hiddenPromptTextarea) {
                    editor.setData(hiddenPromptTextarea.value || '');
                    editor.model.document.on('change:data', () => { hiddenPromptTextarea.value = editor.getData(); });
                }
            })
            .catch(error => {
                console.error('Erro CKEditor:', error);
                initializeMainPromptFieldFallback();
                showGlobalToast('warning', 'Editor avançado falhou. Usando campo de texto simples.');
            });
    } else { 
        console.warn('CKEditor não carregado/container não encontrado. Usando textarea padrão.');
        initializeMainPromptFieldFallback();
    }

    if(apiKeyStatusIndicator) checkAndDisplayApiKeyStatus();
    async function checkAndDisplayApiKeyStatus() { /* ... (como antes) ... */ }

    if (promptTemplateSelect) { /* ... (lógica de templates como antes, usando mainPromptField para setar/limpar) ... */ }

    if (temperatureSlider && tempValueDisplay) { /* ... (como antes) ... */ }

    if (promptGenerationForm) {
        promptGenerationForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            if(generateBtnSpinner) generateBtnSpinner.classList.remove('d-none');
            if(generatePromptBtn) generatePromptBtn.disabled = true;
            if(generatedResultOutputDiv) generatedResultOutputDiv.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-secondary" role="status"></div><p class="mt-2 text-muted">A IA está pensando...</p></div>';
            if(copyResultBtn) copyResultBtn.classList.add('d-none');

            let rawPromptText = '';
            if (mainPromptField) {
                rawPromptText = (typeof mainPromptField.getData === 'function') ? mainPromptField.getData() : mainPromptField.value;
            }
            if (hiddenPromptTextarea) hiddenPromptTextarea.value = rawPromptText;

            let finalPromptText = rawPromptText;
            const templateCustomValues = {};
            let allRequiredFieldsFilled = true;
            if (customTemplateFieldsContainer) {
                const customFields = customTemplateFieldsContainer.querySelectorAll('[name^="template_fields["]');
                if (customFields.length > 0) {
                    customFields.forEach(field => { /* ... (validação e substituição de placeholders como antes) ... */ });
                }
            }
            if (!allRequiredFieldsFilled) { /* ... (mostrar alerta e retornar) ... */ }
            if (finalPromptText.trim() === ''){ /* ... (mostrar alerta e retornar) ... */ }

            const payload = { /* ... (payload como antes) ... */ };
            
            try {
                const response = await axios.post('api/generate_prompt.php', payload);
                if (response.data.success && response.data.generated_text) {
                    if(generatedResultOutputDiv) {
                        generatedResultOutputDiv.textContent = response.data.generated_text; // Exibe como texto puro
                    }
                    if(copyResultBtn) copyResultBtn.classList.remove('d-none');
                    showGlobalToast('success', 'Prompt gerado com sucesso!');
                    fetchRecentHistory(); // ATUALIZA O HISTÓRICO RECENTE
                } else { /* ... (tratamento de erro como antes) ... */ }
            } catch (error) { /* ... (tratamento de erro como antes) ... */ }
            finally { /* ... (resetar botão como antes) ... */ }
        });
    }

    if (copyResultBtn && generatedResultOutputDiv) {
        copyResultBtn.addEventListener('click', function () {
            const originalBtnHTML = this.innerHTML;
            const textToCopy = (generatedResultOutputDiv.textContent || generatedResultOutputDiv.innerText || "").trim();
            if (textToCopy === '') { showGlobalToast('info', 'Nada para copiar do resultado.'); return; }
            
            navigator.clipboard.writeText(textToCopy)
                .then(() => { 
                    this.innerHTML = '<i class="fas fa-check me-1"></i>Copiado!';
                    this.classList.remove('btn-outline-secondary');
                    this.classList.add('btn-success');
                    setTimeout(() => {
                        this.innerHTML = originalBtnHTML;
                        this.classList.remove('btn-success');
                        this.classList.add('btn-outline-secondary');
                    }, 2000);
                })
                .catch(err => {
                    console.error('Erro ao copiar resultado da IA:', err);
                    showGlobalAlert('error', 'Falha ao Copiar', 'Não foi possível copiar. Tente selecionar o texto e usar Ctrl+C.');
                });
        });
    }

    async function fetchRecentHistory() {
        if (!recentHistoryContainer) return;
        try {
            const response = await axios.get('api/get_recent_history.php?limit=5');
            if (response.data.success && response.data.history) {
               renderRecentHistoryItems(response.data.history, recentHistoryContainer);
            } else {
                console.warn("Dashboard: Não foi possível carregar/atualizar histórico recente:", response.data.error);
                const listGroup = recentHistoryContainer.querySelector('ul.list-group');
                if(listGroup) listGroup.innerHTML = '<li class="list-group-item text-muted p-3">Falha ao carregar histórico recente.</li>';
            }
        } catch (error) {
            console.error("Dashboard: Erro ao buscar histórico recente:", error);
            const listGroup = recentHistoryContainer.querySelector('ul.list-group');
            if(listGroup) listGroup.innerHTML = '<li class="list-group-item text-danger p-3">Erro de comunicação ao carregar histórico.</li>';
        }
    }

    function renderRecentHistoryItems(items, containerElement) { /* ... (como antes) ... */ }
    if (recentHistoryContainer) { recentHistoryContainer.addEventListener('click', async function(event) { /* ... (como antes) ... */ }); }
    function renderHistoryItemModalContentForDashboard(item) { /* ... (como antes) ... */ }
    // Listeners para botões do modal de histórico do dashboard (copiar, editar, exportar)
    if(modalCopyInputBtnDashboard && historyItemModalBodyForDashboard) { /* ... (como antes) ... */ }
    if(modalCopyOutputBtnDashboard && historyItemModalBodyForDashboard) { /* ... (como antes) ... */ }
    if(modalEditBtnDashboard){ /* ... (como antes, chamando loadHistoryItemForEditingDashboard) ... */ }
    if (historyItemModalElementForDashboard) { // Listener para botões de exportação no modal do dashboard
        historyItemModalElementForDashboard.addEventListener('click', function(event) {
            const exportBtn = event.target.closest('.export-single-history-btn-modal');
            if (exportBtn && currentViewingHistoryItemIdDashboard) {
                event.preventDefault();
                const format = exportBtn.dataset.format;
                window.location.href = `api/export_data.php?type=history_single&itemId=${currentViewingHistoryItemIdDashboard}&format=${format}`;
            }
        });
    }


    // --- LÓGICA DO MODAL DE ASSISTÊNCIA IA ---
    const aiAssistantActions = [ /* ... (definição de aiAssistantActions como antes) ... */ ];
    function renderAiAssistantActions() { /* ... (como antes) ... */ }
    function handleAiAssistantActionSelection(action) { /* ... (como antes) ... */ }

    if (runAiAssistantBtn) {
        runAiAssistantBtn.addEventListener('click', async function() {
            // ... (lógica de runAiAssistantBtn como antes, usando mainPromptField) ...
            // DENTRO DO TRY/CATCH DE SUCESSO DA CHAMADA AXIOS:
            // ...
                if (response.data.success && response.data.assisted_text) {
                    currentAiAssistantOutput = response.data.assisted_text;
                    const actionProcessed = response.data.action_type_processed || (selectedAiAssistantAction ? selectedAiAssistantAction.type : '');

                    if (actionProcessed === 'suggest_variations' && currentAiAssistantOutput.includes('---VARIANT---')) {
                        // ... (renderizar variações com radio) ...
                    } else if (actionProcessed === 'analyze_prompt' && typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
                        try {
                            if(aiAssistantResultOutputDiv) aiAssistantResultOutputDiv.innerHTML = DOMPurify.sanitize(marked.parse(currentAiAssistantOutput));
                        } catch(e) { /* ... fallback para sanitizeHTML ... */ }
                    } else {
                        if(aiAssistantResultOutputDiv) aiAssistantResultOutputDiv.innerHTML = sanitizeHTML(currentAiAssistantOutput).replace(/\n/g, '<br>');
                    }
                    if(applyAiAssistantResultBtn) applyAiAssistantResultBtn.classList.remove('d-none');
                    if(copyAiAssistantResultBtn) copyAiAssistantResultBtn.classList.remove('d-none');
                } 
            // ...
        });
    }

    if (applyAiAssistantResultBtn) {
        applyAiAssistantResultBtn.addEventListener('click', function() {
            // ... (lógica para obter textToApply como antes) ...
            if (textToApply && mainPromptField) {
                if (typeof mainPromptField.setData === 'function') mainPromptField.setData(textToApply);
                else mainPromptField.value = textToApply;
                if (hiddenPromptTextarea) hiddenPromptTextarea.value = textToApply;
                showGlobalToast('success', 'Resultado da assistência aplicado!');
                if(aiAssistanceModalInstance) aiAssistanceModalInstance.hide();
            } // ...
        });
    }
    if (copyAiAssistantResultBtn && aiAssistantResultOutputDiv) { /* ... (como antes, com feedback no botão) ... */ }
    if (aiAssistanceModalElement) { /* ... (listeners show.bs.modal e hidden.bs.modal como antes) ... */ }
    
    // --- LÓGICA PARA EDITAR ITEM DO HISTÓRICO (CARREGAR NO FORMULÁRIO) ---
    const editHistoryItemIdFromStorage = localStorage.getItem('editHistoryItemId');
    const urlHashForEdit = window.location.hash;
    async function loadHistoryItemForEditingDashboard(historyId) { /* ... (como antes, usando mainPromptField) ... */ }
    if (editHistoryItemIdFromStorage) { loadHistoryItemForEditingDashboard(editHistoryItemIdFromStorage); }
    else if (urlHashForEdit.includes('#editHistory') || urlHashForEdit.includes('#edit')) { /* ... (como antes) ... */ }

    // Inicializações
    if(aiAssistantActionsListDiv) renderAiAssistantActions(); 
    // fetchRecentHistory(); // O PHP já carrega o histórico inicial, chamamos após nova geração.

}); // Fim do DOMContentLoaded