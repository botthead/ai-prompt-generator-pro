// public/assets/js/dashboard-main.js

document.addEventListener('DOMContentLoaded', function () {
    // Elementos do Formulário Principal de Geração
    const promptGenerationForm = document.getElementById('promptGenerationForm');
    const promptTemplateSelect = document.getElementById('promptTemplate');
    const customTemplateFieldsContainer = document.getElementById('customTemplateFieldsContainer');
    const promptMainTextEditorContainer = document.getElementById('prompt_main_text_editor_container');
    const hiddenPromptTextarea = document.getElementById('prompt_main_text_hidden');
    let ckEditorPromptInstance;
    let mainPromptField; // Variável unificada para o campo de prompt (CKEditor ou fallback)

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
    // ... (outras variáveis do modal de assistência como antes) ...
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


    // Elementos do Indicador de Status da API Key
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
        }
    }

    // --- INICIALIZAÇÃO CKEDITOR ---
    if (promptMainTextEditorContainer && typeof ClassicEditor !== 'undefined') {
        ClassicEditor
            .create(promptMainTextEditorContainer, {
                toolbar: {
                    items: ['undo', 'redo', '|', 'heading', '|', 'bold', 'italic', '|', 'link', '|', 'bulletedList', 'numberedList'],
                    shouldNotGroupWhenFull: true
                },
                language: 'pt-br',
                placeholder: 'Descreva o que você quer que a IA gere. Use {{placeholders}} se estiver usando um template.',
            })
            .then(editor => {
                ckEditorPromptInstance = editor;
                mainPromptField = editor; // CKEditor é o campo principal
                console.log('CKEditor para prompt principal inicializado.');
                if (hiddenPromptTextarea) {
                    editor.setData(hiddenPromptTextarea.value || '');
                    editor.model.document.on('change:data', () => {
                        hiddenPromptTextarea.value = editor.getData();
                    });
                }
            })
            .catch(error => {
                console.error('Erro ao inicializar CKEditor:', error);
                initializeMainPromptFieldFallback(); // Usa o textarea como fallback
                showGlobalToast('warning', 'Editor avançado falhou. Usando campo de texto simples.');
            });
    } else { // Se CKEditor não está definido ou o container não existe, usa o textarea
        console.warn('CKEditor não carregado ou container não encontrado. Usando textarea padrão.');
        initializeMainPromptFieldFallback();
    }


    // --- STATUS DA API KEY ---
    async function checkAndDisplayApiKeyStatus() {
        // ... (função como definida anteriormente, sem mudanças aqui) ...
        if (!apiKeyStatusIndicator || !apiKeyStatusText || !apiKeyConfigureLink) return;
        apiKeyStatusIndicator.style.display = 'flex';
        apiKeyStatusIndicator.classList.remove('alert-success', 'alert-warning', 'alert-danger', 'alert-info', 'alert-secondary');
        apiKeyStatusIndicator.classList.add('alert-secondary');
        apiKeyStatusText.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Verificando status da API Key...';
        apiKeyConfigureLink.style.display = 'none';
        try {
            const response = await axios.get('api/get_api_key_status.php');
            apiKeyStatusIndicator.classList.remove('alert-secondary');
            if (response.data.hasApiKey && response.data.keySeemsValid) {
                apiKeyStatusText.textContent = 'Configurada e parece válida (será testada no uso).';
                apiKeyStatusIndicator.classList.add('alert-success');
                apiKeyConfigureLink.style.display = 'none';
            } else if (response.data.hasApiKey && !response.data.keySeemsValid) {
                apiKeyStatusText.textContent = 'Configurada, mas há um problema ao acessá-la. Reconfigure.';
                apiKeyStatusIndicator.classList.add('alert-danger');
                apiKeyConfigureLink.style.display = 'inline-block';
            } else { 
                apiKeyStatusText.textContent = 'Não configurada. Alguns recursos podem não funcionar.';
                apiKeyStatusIndicator.classList.add('alert-warning');
                apiKeyConfigureLink.style.display = 'inline-block';
            }
        } catch (error) {
            console.error("Erro ao verificar status da API Key:", error);
            apiKeyStatusIndicator.classList.remove('alert-secondary');
            apiKeyStatusText.textContent = 'Não foi possível verificar o status da API Key.';
            apiKeyStatusIndicator.classList.add('alert-danger');
            apiKeyConfigureLink.style.display = 'inline-block';
        }
    }
    if(apiKeyStatusIndicator) checkAndDisplayApiKeyStatus();


    // --- LÓGICA DE TEMPLATES ---
    if (promptTemplateSelect) {
        promptTemplateSelect.addEventListener('change', async function () {
            const templateId = this.value;
            customTemplateFieldsContainer.innerHTML = ''; 
            
            let initialPromptStructure = '';
            // Limpar o campo principal
            if (mainPromptField) { // Usa a variável unificada
                if (typeof mainPromptField.setData === 'function') mainPromptField.setData(''); // CKEditor
                else mainPromptField.value = ''; // Textarea
            }
            if (hiddenPromptTextarea) hiddenPromptTextarea.value = '';


            if (!templateId) {
                if (mainPromptField && typeof mainPromptField.setAttribute === 'function') { // Para textarea
                    mainPromptField.placeholder = "Descreva o que você quer que a IA gere...";
                } else if (ckEditorPromptInstance) {
                    // O placeholder do CKEditor é tratado na config de inicialização.
                }
                return;
            }

            showGlobalLoader(true);
            try {
                const response = await axios.get(`api/get_template_details.php?id=${templateId}`);
                if (response.data.success && response.data.template) {
                    const template = response.data.template;
                    initialPromptStructure = template.prompt_structure || '';
                    
                    if (mainPromptField) {
                        if (typeof mainPromptField.setData === 'function') mainPromptField.setData(initialPromptStructure);
                        else mainPromptField.value = initialPromptStructure;
                    }
                    if (hiddenPromptTextarea) hiddenPromptTextarea.value = initialPromptStructure;


                    // Renderizar campos personalizados do template (LÓGICA COPIADA E ADAPTADA DE templates-manager.js)
                    if (template.custom_fields_decoded && Array.isArray(template.custom_fields_decoded)) {
                        template.custom_fields_decoded.forEach(field => {
                            const formGroup = document.createElement('div');
                            formGroup.className = 'mb-3 border p-3 rounded bg-light-subtle template-custom-field-group';
                            const label = document.createElement('label');
                            label.htmlFor = `template_field_${field.name}`;
                            label.className = 'form-label fw-medium';
                            label.textContent = field.label || field.name;
                            if (field.required) {
                                const requiredSpan = document.createElement('span');
                                requiredSpan.className = 'text-danger ms-1'; requiredSpan.textContent = '*';
                                label.appendChild(requiredSpan);
                            }
                            formGroup.appendChild(label);
                            let inputElement;
                            switch (field.type) {
                                case 'textarea':
                                    inputElement = document.createElement('textarea'); inputElement.rows = 3; break;
                                case 'number':
                                    inputElement = document.createElement('input'); inputElement.type = 'number';
                                    if (field.min !== undefined && field.min !== null) inputElement.min = field.min;
                                    if (field.max !== undefined && field.max !== null) inputElement.max = field.max;
                                    break;
                                case 'select':
                                    inputElement = document.createElement('select');
                                    if (field.options && Array.isArray(field.options)) {
                                        const defaultOption = document.createElement('option'); defaultOption.value = "";
                                        defaultOption.textContent = `-- Selecione ${field.label || field.name} --`;
                                        if (!field.required || (field.default !== undefined && field.default === "")) defaultOption.selected = true;
                                        inputElement.appendChild(defaultOption);
                                        field.options.forEach(optValue => {
                                            const optionEl = document.createElement('option'); optionEl.value = optValue; optionEl.textContent = optValue;
                                            if (field.default === optValue) optionEl.selected = true;
                                            inputElement.appendChild(optionEl);
                                        });
                                    }
                                    break;
                                default: inputElement = document.createElement('input'); inputElement.type = 'text'; break;
                            }
                            inputElement.className = 'form-control form-control-sm'; inputElement.id = `template_field_${field.name}`;
                            inputElement.name = `template_fields[${field.name}]`;
                            if (field.placeholder) inputElement.placeholder = field.placeholder;
                            if (field.type !== 'select' && field.default !== undefined && field.default !== null) inputElement.value = field.default;
                            if (field.required) inputElement.required = true;
                            formGroup.appendChild(inputElement);
                            customTemplateFieldsContainer.appendChild(formGroup);
                        });
                    }
                } else { showGlobalToast('error', response.data.error || 'Erro ao carregar template.'); }
            } catch (error) { console.error('Erro ao buscar template:', error); showGlobalToast('error', 'Falha na comunicação ao carregar template.'); }
            finally { showGlobalLoader(false); }
        });
        // ... (lógica de carregar template do localStorage como antes) ...
        const selectedTemplateIdToUse = localStorage.getItem('selectedTemplateIdToUse');
        if (selectedTemplateIdToUse) {
            promptTemplateSelect.value = selectedTemplateIdToUse;
            const changeEvent = new Event('change', { bubbles: true });
            promptTemplateSelect.dispatchEvent(changeEvent);
            localStorage.removeItem('selectedTemplateIdToUse');
        }
    }


    // --- LÓGICA DE GERAÇÃO DE PROMPT ---
    if (temperatureSlider && tempValueDisplay) { /* ... (como antes) ... */ }

    if (promptGenerationForm) {
        promptGenerationForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            if(generateBtnSpinner) generateBtnSpinner.classList.remove('d-none');
            if(generatePromptBtn) generatePromptBtn.disabled = true;
            // ... (resto como antes) ...

            let rawPromptText = '';
            if (mainPromptField) { // Usa a variável unificada
                rawPromptText = (typeof mainPromptField.getData === 'function') ? mainPromptField.getData() : mainPromptField.value;
            }
            if (hiddenPromptTextarea) hiddenPromptTextarea.value = rawPromptText;

            // ... (lógica de validação de campos de template e prompt vazio como antes) ...
             let finalPromptText = rawPromptText;
            const templateCustomValues = {};
            let allRequiredFieldsFilled = true;

            const customFields = customTemplateFieldsContainer.querySelectorAll('[name^="template_fields["]');
            if (customFields.length > 0) {
                customFields.forEach(field => {
                    const fieldName = field.name.match(/template_fields\[(.*?)\]/)[1];
                    templateCustomValues[fieldName] = field.value;
                    field.classList.remove('is-invalid'); 
                    let feedback = field.parentNode.querySelector('.invalid-feedback');
                    if(feedback) feedback.remove();

                    if (field.required && field.value.trim() === '') {
                        allRequiredFieldsFilled = false;
                        field.classList.add('is-invalid');
                        feedback = document.createElement('div');
                        feedback.className = 'invalid-feedback d-block';
                        feedback.textContent = 'Este campo do template é obrigatório.';
                        field.parentNode.appendChild(feedback);
                    }
                    const placeholder = new RegExp(`\\{\\{\\s*${fieldName}\\s*\\}\\}`, 'g');
                    finalPromptText = finalPromptText.replace(placeholder, field.value);
                });
            }

            if (!allRequiredFieldsFilled) {
                showGlobalAlert('error', 'Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios do template marcado com *.');
                if(generateBtnSpinner) generateBtnSpinner.classList.add('d-none');
                if(generatePromptBtn) generatePromptBtn.disabled = false;
                return;
            }
            if (finalPromptText.trim() === ''){ // Valida o finalPromptText
                showGlobalAlert('error', 'Prompt Vazio', 'O prompt final (após preencher o template, se houver) não pode estar vazio.');
                if(generateBtnSpinner) generateBtnSpinner.classList.add('d-none');
                if(generatePromptBtn) generatePromptBtn.disabled = false;
                return;
            }


            const payload = { /* ... (payload como antes) ... */ };
            
            // ... (try-catch-finally da chamada Axios como antes) ...
            try {
                const response = await axios.post('api/generate_prompt.php', payload);
                // ... (mesmo tratamento de resposta) ...
            } catch (error) {
                // ... (mesmo tratamento de erro) ...
            } finally {
                if(generateBtnSpinner) generateBtnSpinner.classList.add('d-none');
                if(generatePromptBtn) generatePromptBtn.disabled = false;
            }
        });
    }

    if (copyResultBtn && generatedResultOutputDiv) { /* ... (código corrigido do copyResultBtn como antes) ... */
        copyResultBtn.addEventListener('click', function () {
            const textToCopy = (generatedResultOutputDiv.textContent || generatedResultOutputDiv.innerText || "").trim();
            if (textToCopy === '') { showGlobalToast('info', 'Nada para copiar do resultado.'); return; }
            navigator.clipboard.writeText(textToCopy)
                .then(() => { showGlobalToast('success', 'Resultado da IA copiado!'); })
                .catch(err => {
                    console.error('Erro ao copiar resultado da IA:', err);
                    showGlobalAlert('error', 'Falha ao Copiar', 'Não foi possível copiar automaticamente. Tente selecionar o texto e usar Ctrl+C.');
                });
        });
    }

    // --- LÓGICA DO HISTÓRICO RECENTE (NO DASHBOARD) ---
    // ... (funções fetchRecentHistory, renderRecentHistoryItems, e listener para .view-history-btn e .delete-history-btn como antes) ...
    // ... (função renderHistoryItemModalContentForDashboard como antes) ...
    // ... (listeners para botões de copiar e editar DENTRO do modal de histórico do DASHBOARD como antes) ...


    // --- LÓGICA DO MODAL DE ASSISTÊNCIA IA ---
    if (aiActionTypeSelect) { /* ... (como antes) ... */ }
    if (runAiAssistantBtn) {
        runAiAssistantBtn.addEventListener('click', async function() {
            // ...
            let currentPromptForAssistant = '';
            if (mainPromptField) { // Usa a variável unificada
                currentPromptForAssistant = (typeof mainPromptField.getData === 'function') ? mainPromptField.getData() : mainPromptField.value;
            }
            // ... (resto da lógica de payload e chamada AJAX como antes) ...
        });
    }
    if (applyAiAssistantResultBtn) {
        applyAiAssistantResultBtn.addEventListener('click', function() {
            // ... (lógica para obter textToApply como antes) ...
            if (textToApply) {
                if (mainPromptField) { // Usa a variável unificada
                    if (typeof mainPromptField.setData === 'function') mainPromptField.setData(textToApply);
                    else mainPromptField.value = textToApply;
                }
                if (hiddenPromptTextarea) hiddenPromptTextarea.value = textToApply; // Sincroniza
                
                showGlobalToast('success', 'Resultado da assistência aplicado ao prompt!');
                if(aiAssistanceModalInstance) aiAssistanceModalInstance.hide();
            } else { /* ... */ }
        });
    }
    if (aiAssistanceModalElement) { /* ... (listener para 'hidden.bs.modal' como antes) ... */ }


    // --- LÓGICA PARA EDITAR ITEM DO HISTÓRICO (CARREGAR NO FORMULÁRIO) ---
    // ... (função loadHistoryItemForEditing e a lógica para chamá-la como antes, mas usando mainPromptField) ...
    async function loadHistoryItemForEditing(historyId) {
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
                if (mainPromptField) { // Usa a variável unificada
                    if (typeof mainPromptField.setData === 'function') mainPromptField.setData(basePromptValue);
                    else mainPromptField.value = basePromptValue;
                }
                if (hiddenPromptTextarea) hiddenPromptTextarea.value = basePromptValue;

                // ... (resto da lógica de preencher temperatura, max tokens, e campos de template se houver, como antes) ...
                const genSettings = inputParams.generation_settings_input || {};
                // ... (preencher temperatureSlider e maxOutputTokensInput) ...

                if (inputParams.template_id_used && promptTemplateSelect) {
                    promptTemplateSelect.value = inputParams.template_id_used;
                    const changeEvent = new Event('change', { bubbles: true });
                    promptTemplateSelect.dispatchEvent(changeEvent); 
                    setTimeout(() => { /* ... preencher campos do template ... */ }, 800);
                } else {
                     showGlobalToast('info', 'Item do histórico carregado para edição no formulário.');
                }
                if(promptGenerationForm) promptGenerationForm.scrollIntoView({ behavior: 'smooth', block: 'start' });

            } else { showGlobalAlert('error', 'Erro ao Carregar', response.data.error || 'Item do histórico não encontrado.'); }
        } catch (error) { /* ... */ }
        finally { /* ... */ }
    }
    // ... (lógica para chamar loadHistoryItemForEditing com base no localStorage ou hash, como antes) ...

}); // Fim do DOMContentLoaded