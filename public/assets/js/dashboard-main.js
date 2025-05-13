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
    const historyItemModalElementForDashboard = document.getElementById('historyItemModal'); // Mesmo ID do modal de history.php
    const historyItemModalInstanceForDashboard = historyItemModalElementForDashboard ? new bootstrap.Modal(historyItemModalElementForDashboard) : null;
    const historyItemModalBodyForDashboard = document.getElementById('historyItemModalBody'); // Mesmo ID
    const modalCopyInputBtnDashboard = document.getElementById('modalCopyHistoryInputBtn');
    const modalCopyOutputBtnDashboard = document.getElementById('modalCopyHistoryOutputBtn');
    const modalEditBtnDashboard = document.getElementById('modalEditHistoryItemBtn');
    let currentViewingHistoryItemIdDashboard = null;


    // Elementos do Modal de Assistência IA
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

    // Elementos do Indicador de Status da API Key
    const apiKeyStatusIndicator = document.getElementById('apiKeyStatusIndicator');
    const apiKeyStatusText = document.getElementById('apiKeyStatusText');
    const apiKeyConfigureLink = document.getElementById('apiKeyConfigureLink');

    function initializeMainPromptFieldFallback() {
        if (hiddenPromptTextarea) {
            if (promptMainTextEditorContainer) promptMainTextEditorContainer.style.display = 'none';
            hiddenPromptTextarea.style.display = 'block';
            hiddenPromptTextarea.rows = 10; // Defina uma altura razoável
            hiddenPromptTextarea.classList.add('form-control'); // Aplica estilo Bootstrap
            hiddenPromptTextarea.placeholder = "O editor avançado não pôde ser carregado. Digite seu prompt aqui...";
            mainPromptField = hiddenPromptTextarea;
        } else {
            console.error("Textarea de fallback (prompt_main_text_hidden) não encontrado!");
            // Como último recurso, se nem o hidden textarea existir, cria um dinamicamente (menos ideal)
            if (promptGenerationForm && !document.getElementById('prompt_main_text_dynamic_fallback')) {
                const dynamicTextarea = document.createElement('textarea');
                dynamicTextarea.id = 'prompt_main_text_dynamic_fallback';
                dynamicTextarea.name = 'prompt_main_text'; // Para o caso de submissão não-AJAX
                dynamicTextarea.className = 'form-control';
                dynamicTextarea.rows = 10;
                dynamicTextarea.placeholder = "Erro crítico: Campo de prompt não pôde ser carregado.";
                const labelForEditor = promptGenerationForm.querySelector('label[for="prompt_main_text_editor_container"]');
                if (labelForEditor) {
                    labelForEditor.after(dynamicTextarea);
                } else {
                    // Adicionar ao final do formulário se o label não for encontrado
                    const firstButton = promptGenerationForm.querySelector('button[type="submit"]');
                    if(firstButton) firstButton.before(dynamicTextarea);
                    else promptGenerationForm.appendChild(dynamicTextarea);
                }
                mainPromptField = dynamicTextarea;
            }
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
                mainPromptField = editor;
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
                initializeMainPromptFieldFallback();
                showGlobalToast('warning', 'Editor avançado falhou. Usando campo de texto simples.');
            });
    } else { 
        console.warn('CKEditor não carregado ou container não encontrado. Usando textarea padrão.');
        initializeMainPromptFieldFallback();
    }

    // --- STATUS DA API KEY ---
    async function checkAndDisplayApiKeyStatus() {
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
            if(customTemplateFieldsContainer) customTemplateFieldsContainer.innerHTML = ''; 
            
            let initialPromptStructure = '';
            if (mainPromptField) {
                if (typeof mainPromptField.setData === 'function') mainPromptField.setData('');
                else mainPromptField.value = '';
            }
            if (hiddenPromptTextarea) hiddenPromptTextarea.value = '';

            if (!templateId) {
                if (mainPromptField && mainPromptField.placeholder !== undefined) { // Para textarea ou input
                     mainPromptField.placeholder = "Descreva o que você quer que a IA gere...";
                } else if (ckEditorPromptInstance && ckEditorPromptInstance.sourceElement) { // Para CKEditor, o placeholder é na config
                    // Não há como mudar o placeholder do CKEditor dinamicamente de forma simples após a inicialização.
                    // Apenas limpar o conteúdo fará o placeholder da config aparecer.
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

                    if (customTemplateFieldsContainer && template.custom_fields_decoded && Array.isArray(template.custom_fields_decoded)) {
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
        const selectedTemplateIdToUse = localStorage.getItem('selectedTemplateIdToUse');
        if (selectedTemplateIdToUse && promptTemplateSelect) { // Verifica se promptTemplateSelect existe
            promptTemplateSelect.value = selectedTemplateIdToUse;
            const changeEvent = new Event('change', { bubbles: true });
            promptTemplateSelect.dispatchEvent(changeEvent);
            localStorage.removeItem('selectedTemplateIdToUse');
        }
    }

    // --- LÓGICA DE GERAÇÃO DE PROMPT ---
    if (temperatureSlider && tempValueDisplay) {
        temperatureSlider.addEventListener('input', function () {
            tempValueDisplay.textContent = this.value;
            tempValueDisplay.classList.remove('bg-secondary', 'bg-danger', 'bg-warning', 'bg-info', 'bg-primary');
            if(this.value >= 1.5) tempValueDisplay.classList.add('bg-danger');
            else if (this.value >= 0.9) tempValueDisplay.classList.add('bg-warning');
            else if (this.value <= 0.3) tempValueDisplay.classList.add('bg-info');
            else tempValueDisplay.classList.add('bg-primary');
        });
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

            if (customTemplateFieldsContainer) { // Garante que o container existe
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
            }

            if (!allRequiredFieldsFilled) {
                showGlobalAlert('error', 'Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios do template marcado com *.');
                if(generateBtnSpinner) generateBtnSpinner.classList.add('d-none');
                if(generatePromptBtn) generatePromptBtn.disabled = false;
                return;
            }
            if (finalPromptText.trim() === ''){
                showGlobalAlert('error', 'Prompt Vazio', 'O prompt final (após preencher o template, se houver) não pode estar vazio.');
                if(generateBtnSpinner) generateBtnSpinner.classList.add('d-none');
                if(generatePromptBtn) generatePromptBtn.disabled = false;
                return;
            }

            const payload = {
                raw_prompt_text: rawPromptText, final_prompt_text: finalPromptText,
                template_id_used: promptTemplateSelect ? promptTemplateSelect.value : null,
                template_custom_values: templateCustomValues,
                temperature: temperatureSlider ? parseFloat(temperatureSlider.value) : 0.7,
                maxOutputTokens: maxOutputTokensInput ? parseInt(maxOutputTokensInput.value) : 1024
            };
            
            try {
                const response = await axios.post('api/generate_prompt.php', payload); // CSRF via X-Header
                if (response.data.success && response.data.generated_text) {
                    if(generatedResultOutputDiv) {
                        generatedResultOutputDiv.textContent = response.data.generated_text;
                    }
                    if(copyResultBtn) copyResultBtn.classList.remove('d-none');
                    showGlobalToast('success', 'Prompt gerado com sucesso!');
                    fetchRecentHistory();
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

    if (copyResultBtn && generatedResultOutputDiv) {
        copyResultBtn.addEventListener('click', function () {
            const textToCopy = (generatedResultOutputDiv.textContent || generatedResultOutputDiv.innerText || "").trim();
            if (textToCopy === '') { showGlobalToast('info', 'Nada para copiar do resultado.'); return; }
            navigator.clipboard.writeText(textToCopy)
                .then(() => { showGlobalToast('success', 'Resultado da IA copiado!'); })
                .catch(err => {
                    console.error('Erro ao copiar resultado da IA:', err);
                    showGlobalAlert('error', 'Falha ao Copiar', 'Não foi possível copiar. Verifique as permissões do navegador ou tente selecionar manualmente.');
                });
        });
    }

    // --- LÓGICA DO HISTÓRICO RECENTE (NO DASHBOARD) ---
    async function fetchRecentHistory() {
        if (!recentHistoryContainer) return;
        try {
            // Não mostra loader global para esta atualização sutil, pode adicionar um spinner local se quiser.
            const response = await axios.get('api/get_recent_history.php?limit=5'); // Usa o novo endpoint
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

    function renderRecentHistoryItems(items, containerElement) {
        const listGroup = containerElement.querySelector('ul.list-group');
        if (!listGroup) { 
            console.error("Elemento ul.list-group não encontrado em recentHistoryContainer.");
            return;
        }
        listGroup.innerHTML = ''; 
        
        const cardFooterLink = containerElement.closest('.card')?.querySelector('.card-footer a');

        if (items.length === 0) {
            listGroup.innerHTML = '<li class="list-group-item text-muted text-center p-4">Nenhum prompt gerado recentemente.</li>';
            if(cardFooterLink) cardFooterLink.style.display = 'none';
            return;
        }
        if(cardFooterLink) cardFooterLink.style.display = 'inline-block';

        items.forEach(item => {
            const inputData = JSON.parse(item.input_parameters || '{}');
            const promptBasePreview = inputData.final_prompt_text || inputData.raw_prompt_text || 'N/A';
            const outputPreview = item.generated_text_preview || (item.generated_text ? item.generated_text.substring(0,100) + '...' : 'N/A');

            const li = document.createElement('li');
            li.className = 'list-group-item history-item p-2';
            li.innerHTML = `
                <div class="d-flex w-100 justify-content-between align-items-center">
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
                <p class="mb-1 mt-1 small cursor-pointer view-history-btn" data-history-id="${item.id}" title="${sanitizeHTML(promptBasePreview)}">
                    <strong>In:</strong> ${sanitizeHTML(promptBasePreview.substring(0, 60))}${promptBasePreview.length > 60 ? '...' : ''}
                </p>
                <p class="mb-0 text-break small cursor-pointer view-history-btn" data-history-id="${item.id}" title="${sanitizeHTML(item.generated_text)}">
                    <small><strong>Out:</strong> ${sanitizeHTML(outputPreview.substring(0, 80))}${outputPreview.length > 80 ? '...' : ''}</small>
                </p>
            `;
            listGroup.appendChild(li);
        });
    }
    
    if (recentHistoryContainer) {
        recentHistoryContainer.addEventListener('click', async function(event) {
            const viewButton = event.target.closest('.view-history-btn');
            const deleteButton = event.target.closest('.delete-history-btn');
            // const pageCsrfToken = document.querySelector('input[name="csrf_token_generate"]')?.value; // Não mais necessário se CSRF global Axios

            if (viewButton) {
                currentViewingHistoryItemIdDashboard = viewButton.dataset.historyId;
                if(historyItemModalBodyForDashboard) historyItemModalBodyForDashboard.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div><p class="mt-3 text-muted">Carregando detalhes...</p></div>';
                if (modalEditBtnDashboard) { 
                    modalEditBtnDashboard.dataset.historyId = currentViewingHistoryItemIdDashboard; 
                    modalEditBtnDashboard.classList.remove('d-none');
                }
                if(historyItemModalInstanceForDashboard) historyItemModalInstanceForDashboard.show();
                
                try {
                    const response = await axios.get(`api/get_history_item.php?id=${currentViewingHistoryItemIdDashboard}`);
                    if (response.data.success && response.data.item) {
                        renderHistoryItemModalContentForDashboard(response.data.item);
                    } else {
                        if(historyItemModalBodyForDashboard) historyItemModalBodyForDashboard.innerHTML = `<div class="alert alert-danger">${sanitizeHTML(response.data.error || 'Erro ao carregar item.')}</div>`;
                    }
                } catch (error) { /* ... */ }
            }

            if (deleteButton) {
                const historyId = deleteButton.dataset.historyId;
                Swal.fire({ /* ... config de confirmação ... */ }).then(async (result) => {
                    if (result.isConfirmed) {
                        showGlobalLoader(true);
                        try {
                            const response = await axios.post('api/delete_history_item.php', { id: historyId }); // CSRF via X-Header
                            if (response.data.success) {
                                showGlobalToast('success', 'Item do histórico excluído.');
                                deleteButton.closest('li.list-group-item').remove();
                                const listGroup = recentHistoryContainer.querySelector('ul.list-group');
                                if (listGroup && listGroup.children.length === 0) {
                                    listGroup.innerHTML = '<li class="list-group-item text-muted text-center p-4">Nenhum prompt gerado recentemente.</li>';
                                    const footerLink = recentHistoryContainer.closest('.card')?.querySelector('.card-footer a');
                                    if(footerLink) footerLink.style.display = 'none';
                                }
                            } else { showGlobalAlert('error', 'Erro ao Excluir', sanitizeHTML(response.data.error || 'Não foi possível excluir.')); }
                        } catch (error) { /* ... */ }
                        finally { showGlobalLoader(false); }
                    }
                });
            }
        });
    }
    
    function renderHistoryItemModalContentForDashboard(item) {
        if (!historyItemModalBodyForDashboard) return;
        // ... (código HTML para renderizar detalhes do item, como definido anteriormente) ...
        // Garantir que está usando item.generated_text (completo) para o <pre> do Output
        const inputParams = JSON.parse(item.input_parameters || '{}');
        let html = `
            <h4><i class="fas fa-file-alt me-2 text-primary"></i>Prompt Enviado à IA:</h4>
            <pre class="bg-light p-3 border rounded mb-3" style="font-size:0.9em; max-height: 200px; overflow-y: auto;">${sanitizeHTML(inputParams.final_prompt_text || inputParams.raw_prompt_text || 'N/A')}</pre>
            
            <h4><i class="fas fa-robot me-2 text-success"></i>Resultado Gerado:</h4>
            <pre class="bg-light p-3 border rounded mb-3" style="font-size:0.9em; max-height: 300px; overflow-y: auto;">${sanitizeHTML(item.generated_text)}</pre> 
            <hr class="my-3">
            <p class="text-center"><small class="text-muted">Gerado em: ${new Date(item.created_at).toLocaleString('pt-BR')}</small></p>`;
        historyItemModalBodyForDashboard.innerHTML = html;
    }
    
    // ... (Listeners para botões do modal de histórico do dashboard como antes) ...


    // --- LÓGICA DO MODAL DE ASSISTÊNCIA IA ---
    // ... (definição de aiAssistantActions e renderAiAssistantActions como antes) ...
    // ... (handleAiAssistantActionSelection como antes) ...
    // ... (listener de runAiAssistantBtn, garantindo que pega current_prompt_text de mainPromptField, e payload não envia CSRF) ...
    // ... (listener de applyAiAssistantResultBtn, garantindo que seta em mainPromptField) ...
    // ... (listener de copyAiAssistantResultBtn como antes) ...
    // ... (listener de hidden.bs.modal para aiAssistanceModalElement como antes) ...


    // --- LÓGICA PARA EDITAR ITEM DO HISTÓRICO (CARREGAR NO FORMULÁRIO) ---
    // ... (loadHistoryItemForEditingDashboard e a lógica para chamá-la como antes, usando mainPromptField) ...
    // Certifique-se que esta função e sua chamada estão corretamente implementadas como na versão anterior.

    // Chamar para popular a lista de ações do modal de assistência
    if(aiAssistantActionsListDiv) renderAiAssistantActions(); 
    // Chamar para carregar o histórico recente inicial no dashboard
    if(recentHistoryContainer) fetchRecentHistory(); // Ou deixar o PHP carregar inicialmente
// ... (outras lógicas do dashboard) ...

    // Delegação para botões de exportação no modal de histórico (se o modal for o mesmo ID)
    if (historyItemModalElementForDashboard) { // Verifica se o elemento do modal existe nesta página
        historyItemModalElementForDashboard.addEventListener('click', function(event) {
            const exportBtn = event.target.closest('.export-single-history-btn-modal');
            if (exportBtn && currentViewingHistoryItemIdDashboard) { // Usa a variável de ID do dashboard
                event.preventDefault();
                const format = exportBtn.dataset.format;
                // O endpoint 'export_data.php' já lida com dataType 'history_single'
                window.location.href = `api/export_data.php?type=history_single&itemId=${currentViewingHistoryItemIdDashboard}&format=${format}`;
            }
        });
    }
    // ... (resto do dashboard-main.js) ...

}); // Fim do DOMContentLoaded