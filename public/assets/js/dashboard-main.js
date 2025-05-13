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

    // Elementos da Saída da IA
    const generatedResultOutputDiv = document.getElementById('generatedResultOutput');
    const copyResultBtn = document.getElementById('copyResultBtn');

    // Elementos do Histórico Recente (no Dashboard)
    const recentHistoryContainer = document.getElementById('recentHistoryContainer');
    const historyItemModalElementForDashboard = document.getElementById('historyItemModal');
    const historyItemModalInstanceForDashboard = historyItemModalElementForDashboard ? new bootstrap.Modal(historyItemModalElementForDashboard) : null;
    const historyItemModalBodyForDashboard = document.getElementById('historyItemModalBody');
    const modalCopyInputBtnDashboard = document.getElementById('modalCopyHistoryInputBtn');
    const modalCopyOutputBtnDashboard = document.getElementById('modalCopyHistoryOutputBtn');
    const modalEditBtnDashboard = document.getElementById('modalEditHistoryItemBtn');
    let currentViewingHistoryItemIdDashboard = null;

    // Elementos do Modal de Assistência IA
    const aiAssistanceModalElement = document.getElementById('aiAssistanceModal');
    const aiAssistanceModalInstance = aiAssistanceModalElement ? new bootstrap.Modal(aiAssistanceModalElement) : null;
    const aiActionTypeSelect = document.getElementById('aiActionType');
    const aiAssistantInputArea = document.getElementById('aiAssistantInputArea');
    const aiAssistantUserInputLabel = document.getElementById('aiAssistantUserInputLabel');
    const aiAssistantUserInput = document.getElementById('aiAssistantUserInput');
    const aiAssistantToneSelectorArea = document.getElementById('aiAssistantToneSelectorArea');
    const aiAssistantNewToneSelect = document.getElementById('aiAssistantNewTone');
    const aiSuggestionCountInput = document.getElementById('aiSuggestionCount');
    const runAiAssistantBtn = document.getElementById('runAiAssistantBtn');
    const runAiAssistantBtnSpinner = runAiAssistantBtn ? runAiAssistantBtn.querySelector('.spinner-border') : null;
    const aiAssistantResultOutputDiv = document.getElementById('aiAssistantResultOutput');
    const applyAiAssistantResultBtn = document.getElementById('applyAiAssistantResultBtn');
    let currentAiAssistantOutput = "";
    let currentAiAssistantActionType = "";

    const apiKeyStatusIndicator = document.getElementById('apiKeyStatusIndicator');
    const apiKeyStatusText = document.getElementById('apiKeyStatusText');
    const apiKeyConfigureLink = document.getElementById('apiKeyConfigureLink');

    function initializeMainPromptFieldFallback() {
        if (hiddenPromptTextarea) {
            if (promptMainTextEditorContainer) promptMainTextEditorContainer.style.display = 'none';
            hiddenPromptTextarea.style.display = 'block';
            hiddenPromptTextarea.rows = 10;
            hiddenPromptTextarea.classList.add('form-control');
            hiddenPromptTextarea.placeholder = "Digite seu prompt aqui...";
            mainPromptField = hiddenPromptTextarea;
        } else {
            console.error("Textarea de fallback (prompt_main_text_hidden) não encontrado!");
            // Criar um textarea dinamicamente como último recurso se nem o hidden existir
            const dynamicTextarea = document.createElement('textarea');
            dynamicTextarea.id = 'prompt_main_text_dynamic_fallback';
            dynamicTextarea.name = 'prompt_main_text';
            dynamicTextarea.className = 'form-control';
            dynamicTextarea.rows = 10;
            dynamicTextarea.placeholder = "Erro: Campo de prompt não pôde ser carregado.";
            if(promptGenerationForm.querySelector('label[for="prompt_main_text_editor_container"]')) {
                promptGenerationForm.querySelector('label[for="prompt_main_text_editor_container"]').after(dynamicTextarea);
            } else {
                 // Adicionar em algum lugar seguro no formulário
            }
            mainPromptField = dynamicTextarea;
        }
    }

    if (promptMainTextEditorContainer && typeof ClassicEditor !== 'undefined') {
        ClassicEditor
            .create(promptMainTextEditorContainer, { /* ... config CKEditor ... */
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
    async function checkAndDisplayApiKeyStatus() { /* ... (como antes, sem mudanças) ... */ }


    if (promptTemplateSelect) { /* ... (lógica de templates como antes, usando mainPromptField para setar/limpar) ... */ }

    if (temperatureSlider && tempValueDisplay) {
        temperatureSlider.addEventListener('input', function () { /* ... (como antes) ... */ });
        temperatureSlider.dispatchEvent(new Event('input'));
    }

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
            const customFields = customTemplateFieldsContainer.querySelectorAll('[name^="template_fields["]');
            // ... (lógica de validação e substituição de placeholders como antes) ...
            if (customFields.length > 0) {
                customFields.forEach(field => { /* ... */ });
            }
            if (!allRequiredFieldsFilled) { /* ... (mostrar alerta e retornar) ... */ }
            if (finalPromptText.trim() === ''){ /* ... (mostrar alerta e retornar) ... */ }


            const payload = { /* ... (payload como antes, sem csrf_token_generate no corpo) ... */
                raw_prompt_text: rawPromptText, final_prompt_text: finalPromptText,
                template_id_used: promptTemplateSelect ? promptTemplateSelect.value : null,
                template_custom_values: templateCustomValues,
                temperature: parseFloat(temperatureSlider.value),
                maxOutputTokens: parseInt(maxOutputTokensInput.value)
            };
            
            try {
                const response = await axios.post('api/generate_prompt.php', payload); // CSRF via X-Header
                if (response.data.success && response.data.generated_text) {
                    if(generatedResultOutputDiv) {
                        generatedResultOutputDiv.textContent = response.data.generated_text; // CORREÇÃO AQUI
                    }
                    if(copyResultBtn) copyResultBtn.classList.remove('d-none');
                    showGlobalToast('success', 'Prompt gerado com sucesso!');
                    fetchRecentHistory(); // ATUALIZA O HISTÓRICO RECENTE
                } else {
                    if(generatedResultOutputDiv) generatedResultOutputDiv.textContent = '';
                    showGlobalAlert('error', 'Erro ao Gerar Prompt', response.data.error || 'Erro desconhecido.');
                    if (response.data.error && (response.data.error.toLowerCase().includes('api key') || response.data.error.toLowerCase().includes('chave da api'))) {
                        if(apiKeyStatusText) apiKeyStatusText.textContent = 'Inválida ou com problemas.';
                        if(apiKeyStatusIndicator) apiKeyStatusIndicator.className = 'alert alert-danger small py-2 mb-3 d-flex align-items-center justify-content-between';
                        if(apiKeyConfigureLink) apiKeyConfigureLink.style.display = 'inline-block';
                    }
                }
            } catch (error) { 
                console.error('Erro na requisição de geração:', error);
                if(generatedResultOutputDiv) generatedResultOutputDiv.textContent = '';
                let errorMsg = 'Falha na comunicação com o servidor.';
                if (error.response && error.response.data && error.response.data.error) {
                    errorMsg = error.response.data.error;
                     if (error.response.status === 401 || error.response.status === 403 || (errorMsg.toLowerCase().includes('api key') || errorMsg.toLowerCase().includes('chave da api'))) {
                        if(apiKeyStatusText) apiKeyStatusText.textContent = 'Não configurada, inválida ou problema de permissão.';
                        if(apiKeyStatusIndicator) apiKeyStatusIndicator.className = 'alert alert-danger small py-2 mb-3 d-flex align-items-center justify-content-between';
                        if(apiKeyConfigureLink) apiKeyConfigureLink.style.display = 'inline-block';
                    }
                } else if (error.message) { errorMsg = error.message; }
                showGlobalAlert('error', 'Erro na Requisição', errorMsg);
            } finally {
                if(generateBtnSpinner) generateBtnSpinner.classList.add('d-none');
                if(generatePromptBtn) generatePromptBtn.disabled = false;
            }
        });
    }

    if (copyResultBtn && generatedResultOutputDiv) { /* ... (código corrigido do copyResultBtn como antes) ... */ }

    // --- LÓGICA DO HISTÓRICO RECENTE (NO DASHBOARD) ---
    async function fetchRecentHistory() {
        if (!recentHistoryContainer) return;
        try {
            // Não precisa de showGlobalLoader aqui para uma atualização sutil
            const response = await axios.get('api/get_recent_history.php?limit=5');
            if (response.data.success && response.data.history) {
               renderRecentHistoryItems(response.data.history, recentHistoryContainer);
            } else {
                console.warn("Dashboard: Não foi possível atualizar histórico recente:", response.data.error);
                const listGroup = recentHistoryContainer.querySelector('ul.list-group');
                if(listGroup) listGroup.innerHTML = '<li class="list-group-item text-muted">Falha ao carregar histórico recente.</li>';
            }
        } catch (error) {
            console.error("Dashboard: Erro ao buscar histórico recente:", error);
            const listGroup = recentHistoryContainer.querySelector('ul.list-group');
            if(listGroup) listGroup.innerHTML = '<li class="list-group-item text-danger">Erro de comunicação ao carregar histórico.</li>';
        }
    }

    function renderRecentHistoryItems(items, containerElement) { /* ... (como antes, mas garanta que está usando generated_text_preview) ... */
        const listGroup = containerElement.querySelector('ul.list-group');
        if (!listGroup) {
            containerElement.innerHTML = ''; 
            const ul = document.createElement('ul');
            ul.className = 'list-group list-group-flush';
            containerElement.appendChild(ul);
        } else {
            listGroup.innerHTML = ''; 
        }
        
        const targetList = containerElement.querySelector('ul.list-group');
        const cardFooterLink = containerElement.closest('.card')?.querySelector('.card-footer a');

        if (items.length === 0) {
            targetList.innerHTML = '<p class="text-muted text-center mt-3 mb-3">Nenhum prompt gerado recentemente.</p>';
            if(cardFooterLink) cardFooterLink.style.display = 'none';
            return;
        }
        if(cardFooterLink) cardFooterLink.style.display = 'inline-block';

        items.forEach(item => {
            const inputData = JSON.parse(item.input_parameters || '{}');
            // Usa final_prompt_text se existir, senão raw_prompt_text, senão N/A
            const promptBasePreview = inputData.final_prompt_text || inputData.raw_prompt_text || 'N/A';
            // Usa generated_text_preview do endpoint (que é um SUBSTRING)
            const outputPreview = item.generated_text_preview || (item.generated_text ? item.generated_text.substring(0,100) + '...' : 'N/A');

            const li = document.createElement('li');
            li.className = 'list-group-item history-item p-2'; // Menor padding
            li.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <small class="text-muted">
                        <i class="fas fa-calendar-alt me-1"></i>${new Date(item.created_at).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit'})}
                    </small>
                    <div>
                        <button class="btn btn-sm btn-outline-info view-history-btn py-0 px-1 me-1" data-history-id="${item.id}" title="Visualizar Detalhes">
                            <i class="fas fa-eye fa-xs"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-history-btn py-0 px-1" data-history-id="${item.id}" title="Excluir">
                            <i class="fas fa-trash-alt fa-xs"></i>
                        </button>
                    </div>
                </div>
                <p class="mb-1 mt-1 small" title="${sanitizeHTML(promptBasePreview)}">
                    <strong>In:</strong> ${sanitizeHTML(promptBasePreview.substring(0, 60))}${promptBasePreview.length > 60 ? '...' : ''}
                </p>
                <p class="mb-0 text-break small" title="${sanitizeHTML(item.generated_text)}">
                    <small><strong>Out:</strong> ${sanitizeHTML(outputPreview.substring(0, 80))}${outputPreview.length > 80 ? '...' : ''}</small>
                </p>
            `;
            targetList.appendChild(li);
        });
    }
    
    // Delegação de eventos para botões de histórico no dashboard e renderização do modal
    if (recentHistoryContainer) { /* ... (como antes, mas chame renderHistoryItemModalContentForDashboard) ... */ }
    function renderHistoryItemModalContentForDashboard(item) { /* ... (como antes) ... */ }
    if(modalCopyInputBtnDashboard && historyItemModalBodyForDashboard) { /* ... (como antes) ... */ }
    if(modalCopyOutputBtnDashboard && historyItemModalBodyForDashboard) { /* ... (como antes) ... */ }
    if(modalEditBtnDashboard){ /* ... (como antes, usando loadHistoryItemForEditingDashboard) ... */ }


    // --- LÓGICA DO MODAL DE ASSISTÊNCIA IA ---
    // ... (sem grandes mudanças, mas garanta que usa mainPromptField para pegar/setar texto) ...
    if (applyAiAssistantResultBtn) {
        applyAiAssistantResultBtn.addEventListener('click', function() {
            // ...
            if (textToApply && mainPromptField) {
                if (typeof mainPromptField.setData === 'function') mainPromptField.setData(textToApply);
                else mainPromptField.value = textToApply;
                if (hiddenPromptTextarea) hiddenPromptTextarea.value = textToApply;
                // ...
            }
        });
    }
    // ... (limpeza do modal como antes) ...


    // --- LÓGICA PARA EDITAR ITEM DO HISTÓRICO (CARREGAR NO FORMULÁRIO) ---
    const editHistoryItemIdFromStorage = localStorage.getItem('editHistoryItemId');
    const urlHashForEdit = window.location.hash;

    async function loadHistoryItemForEditingDashboard(historyId) { // Renomeada para escopo do dashboard
        if (!historyId) return;
        showGlobalLoader(true);
        try {
            const response = await axios.get(`api/get_history_item.php?id=${historyId}`);
            if (response.data.success && response.data.item) {
                const item = response.data.item;
                const inputParams = JSON.parse(item.input_parameters || '{}');

                if (promptTemplateSelect) promptTemplateSelect.value = '';
                if (customTemplateFieldsContainer) customTemplateFieldsContainer.innerHTML = '';
                
                let basePromptValue = inputParams.raw_prompt_text || '';
                if (mainPromptField) {
                    if (typeof mainPromptField.setData === 'function') mainPromptField.setData(basePromptValue);
                    else mainPromptField.value = basePromptValue;
                }
                if (hiddenPromptTextarea) hiddenPromptTextarea.value = basePromptValue;

                const genSettings = inputParams.generation_settings_input || {};
                // ... (lógica de preencher temperatura, max tokens, como antes) ...
                // ... (lógica de carregar template e seus campos, como antes) ...
                
                if(promptGenerationForm) promptGenerationForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                showGlobalToast('info', 'Item do histórico carregado para edição.');

            } else { showGlobalAlert('error', 'Erro ao Carregar', response.data.error || 'Item não encontrado.'); }
        } catch (error) { /* ... */ }
        finally { /* ... */ }
    }

    if (editHistoryItemIdFromStorage) {
        loadHistoryItemForEditingDashboard(editHistoryItemIdFromStorage);
    } else if (urlHashForEdit.includes('#editHistory') || urlHashForEdit.includes('#edit')) {
        const idFromHashMatch = urlHashForEdit.match(/_(.*)/) || urlHashForEdit.match(/#editHistory(.*)/) || urlHashForEdit.match(/#edit(.*)/);
        const idFromHash = idFromHashMatch && idFromHashMatch[1] ? idFromHashMatch[1] : null;
        if(idFromHash && !isNaN(parseInt(idFromHash))) {
             loadHistoryItemForEditingDashboard(parseInt(idFromHash));
        }
    }

}); // Fim do DOMContentLoaded