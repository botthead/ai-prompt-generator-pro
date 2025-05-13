// public/assets/js/dashboard-main.js

document.addEventListener('DOMContentLoaded', function () {
    // Elementos do Formulário Principal de Geração
    const promptGenerationForm = document.getElementById('promptGenerationForm');
    const promptTemplateSelect = document.getElementById('promptTemplate');
    const customTemplateFieldsContainer = document.getElementById('customTemplateFieldsContainer');
    const promptMainTextEditorContainer = document.getElementById('prompt_main_text_editor_container'); // Para CKEditor
    const hiddenPromptTextarea = document.getElementById('prompt_main_text_hidden'); // Fallback e sincronização
    let ckEditorPromptInstance;
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
    // O modal de histórico é global, mas os listeners específicos do dashboard são aqui
    const historyItemModalElementForDashboard = document.getElementById('historyItemModal'); // Mesmo ID do modal de history.php
    const historyItemModalInstanceForDashboard = historyItemModalElementForDashboard ? new bootstrap.Modal(historyItemModalElementForDashboard) : null;
    const historyItemModalBodyForDashboard = document.getElementById('historyItemModalBody'); // Mesmo ID
    // Botões do modal de histórico, mas podem ser usados por este JS se o modal for o mesmo
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

    // Elementos do Indicador de Status da API Key
    const apiKeyStatusIndicator = document.getElementById('apiKeyStatusIndicator');
    const apiKeyStatusText = document.getElementById('apiKeyStatusText');
    const apiKeyConfigureLink = document.getElementById('apiKeyConfigureLink');

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
                console.log('CKEditor para prompt principal inicializado.');
                if (hiddenPromptTextarea) {
                    editor.setData(hiddenPromptTextarea.value || ''); // Sincronização inicial
                    editor.model.document.on('change:data', () => { // Sincronização contínua
                        hiddenPromptTextarea.value = editor.getData();
                    });
                }
            })
            .catch(error => {
                console.error('Erro ao inicializar CKEditor:', error);
                if(hiddenPromptTextarea && promptMainTextEditorContainer) {
                     promptMainTextEditorContainer.style.display = 'none';
                     hiddenPromptTextarea.style.display = 'block';
                     hiddenPromptTextarea.rows = 10;
                     hiddenPromptTextarea.classList.add('form-control');
                     hiddenPromptTextarea.placeholder = "O editor avançado não pôde ser carregado. Digite seu prompt aqui.";
                     showGlobalToast('warning', 'Editor avançado falhou. Usando campo de texto simples.');
                }
            });
    } else if (typeof ClassicEditor === 'undefined' && promptMainTextEditorContainer) {
        console.warn('CKEditor não está definido. Usando textarea padrão.');
        if(hiddenPromptTextarea && promptMainTextEditorContainer) {
            promptMainTextEditorContainer.style.display = 'none';
            hiddenPromptTextarea.style.display = 'block';
            hiddenPromptTextarea.rows = 10;
            hiddenPromptTextarea.classList.add('form-control');
            hiddenPromptTextarea.placeholder = "CKEditor não carregado. Digite seu prompt aqui.";
        }
    } else if (!promptMainTextEditorContainer && hiddenPromptTextarea) {
        // Caso o div do CKEditor não exista, mas o textarea hidden sim, mostre o textarea.
        hiddenPromptTextarea.style.display = 'block';
        hiddenPromptTextarea.rows = 10;
        hiddenPromptTextarea.classList.add('form-control');
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
                apiKeyConfigureLink.style.display = 'inline-block'; // inline-block para links
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
            
            let editorContent = '';
            if (ckEditorPromptInstance) ckEditorPromptInstance.setData('');
            else if (document.getElementById('prompt_main_text_fallback')) document.getElementById('prompt_main_text_fallback').value = '';
            else if (hiddenPromptTextarea) hiddenPromptTextarea.value = '';

            if (!templateId) {
                if (document.getElementById('prompt_main_text_fallback')) document.getElementById('prompt_main_text_fallback').placeholder = "Descreva o que você quer que a IA gere...";
                else if (hiddenPromptTextarea) hiddenPromptTextarea.placeholder = "Descreva o que você quer que a IA gere...";
                // O placeholder do CKEditor é gerenciado por ele mesmo.
                return;
            }

            showGlobalLoader(true);
            try {
                const response = await axios.get(`api/get_template_details.php?id=${templateId}`);
                if (response.data.success && response.data.template) {
                    const template = response.data.template;
                    editorContent = template.prompt_structure || '';
                    
                    if (ckEditorPromptInstance) ckEditorPromptInstance.setData(editorContent);
                    else if (document.getElementById('prompt_main_text_fallback')) document.getElementById('prompt_main_text_fallback').value = editorContent;
                    else if (hiddenPromptTextarea) hiddenPromptTextarea.value = editorContent;

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
                                        if (!field.required || field.default === "") defaultOption.selected = true;
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
        // Verifica se há um template selecionado para usar ao carregar o dashboard
        const selectedTemplateIdToUse = localStorage.getItem('selectedTemplateIdToUse');
        if (selectedTemplateIdToUse) {
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
        temperatureSlider.dispatchEvent(new Event('input')); // Cor inicial
    }

    if (promptGenerationForm) {
        promptGenerationForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            if(generateBtnSpinner) generateBtnSpinner.classList.remove('d-none');
            if(generatePromptBtn) generatePromptBtn.disabled = true;
            if(generatedResultOutputDiv) generatedResultOutputDiv.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-secondary" role="status"></div><p class="mt-2 text-muted">A IA está pensando...</p></div>';
            if(copyResultBtn) copyResultBtn.classList.add('d-none');

            let rawPromptText = '';
            if (ckEditorPromptInstance) rawPromptText = ckEditorPromptInstance.getData();
            else if (document.getElementById('prompt_main_text_fallback')) rawPromptText = document.getElementById('prompt_main_text_fallback').value;
            else if (hiddenPromptTextarea) rawPromptText = hiddenPromptTextarea.value;
            if (hiddenPromptTextarea) hiddenPromptTextarea.value = rawPromptText; // Sincroniza

            let finalPromptText = rawPromptText;
            const templateCustomValues = {};
            let allRequiredFieldsFilled = true;

            const customFields = customTemplateFieldsContainer.querySelectorAll('[name^="template_fields["]');
            if (customFields.length > 0) {
                customFields.forEach(field => {
                    const fieldName = field.name.match(/template_fields\[(.*?)\]/)[1];
                    templateCustomValues[fieldName] = field.value;
                    field.classList.remove('is-invalid'); // Limpa validação anterior
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
            if (rawPromptText.trim() === ''){
                showGlobalAlert('error', 'Prompt Vazio', 'O campo do prompt base não pode estar vazio.');
                if(generateBtnSpinner) generateBtnSpinner.classList.add('d-none');
                if(generatePromptBtn) generatePromptBtn.disabled = false;
                return;
            }

            const payload = { /* ... (payload como antes) ... */
                csrf_token_generate: this.querySelector('input[name="csrf_token_generate"]').value,
                raw_prompt_text: rawPromptText, final_prompt_text: finalPromptText,
                template_id_used: promptTemplateSelect ? promptTemplateSelect.value : null,
                template_custom_values: templateCustomValues,
                temperature: parseFloat(temperatureSlider.value),
                maxOutputTokens: parseInt(maxOutputTokensInput.value)
            };

            try {
                const response = await axios.post('api/generate_prompt.php', payload);
                if (response.data.success && response.data.generated_text) {
                    if(generatedResultOutputDiv) generatedResultOutputDiv.textContent = response.data.generated_text;
                    if(copyResultBtn) copyResultBtn.classList.remove('d-none');
                    showGlobalToast('success', 'Prompt gerado com sucesso!');
                    // fetchRecentHistory(); // Adiar para não sobrecarregar em MVP
                } else {
                    if(generatedResultOutputDiv) generatedResultOutputDiv.textContent = '';
                    showGlobalAlert('error', 'Erro ao Gerar Prompt', response.data.error || 'Erro desconhecido do servidor.');
                    if (response.data.error && (response.data.error.toLowerCase().includes('api key') || response.data.error.toLowerCase().includes('chave da api'))) {
                        if(apiKeyStatusText) apiKeyStatusText.textContent = 'Inválida ou com problemas.';
                        if(apiKeyStatusIndicator) apiKeyStatusIndicator.className = 'alert alert-danger small py-2 mb-3 d-flex align-items-center justify-content-between';
                        if(apiKeyConfigureLink) apiKeyConfigureLink.style.display = 'inline-block';
                    }
                }
            } catch (error) { /* ... (tratamento de erro como antes) ... */
                 console.error('Erro na requisição de geração:', error);
                if(generatedResultOutputDiv) generatedResultOutputDiv.textContent = '';
                let errorMsg = 'Falha na comunicação com o servidor.';
                if (error.response && error.response.data && error.response.data.error) {
                    errorMsg = error.response.data.error;
                     if (error.response.status === 401 || (errorMsg.toLowerCase().includes('api key') || errorMsg.toLowerCase().includes('chave da api'))) {
                        if(apiKeyStatusText) apiKeyStatusText.textContent = 'Não configurada ou inválida.';
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
            // Prioriza textContent, mas innerText pode ser um fallback para alguns casos (embora raro para divs com só texto)
            const textToCopy = (generatedResultOutputDiv.textContent || generatedResultOutputDiv.innerText || "").trim();

            if (textToCopy === '') {
                showGlobalToast('info', 'Nada para copiar do resultado.');
                return;
            }

            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    showGlobalToast('success', 'Resultado da IA copiado para a área de transferência!');
                })
                .catch(err => {
                    console.error('Erro ao copiar resultado da IA:', err);
                    // Tentar um fallback para navegadores mais antigos ou se a permissão falhar (selecionar e copiar manualmente)
                    // No entanto, o método execCommand é obsoleto e não recomendado.
                    // A melhor abordagem é informar o usuário sobre a falha.
                    showGlobalAlert('error', 'Falha ao Copiar', 'Não foi possível copiar automaticamente. Seu navegador pode não suportar esta ação ou as permissões de clipboard não foram concedidas. Você pode tentar selecionar o texto manualmente e usar Ctrl+C / Cmd+C.');
                });
        });
    }

    // --- LÓGICA DO HISTÓRICO RECENTE (NO DASHBOARD) ---
    async function fetchRecentHistory() { // Chamada se quiser atualizar dinamicamente
        if (!recentHistoryContainer) return;
        try {
            showGlobalLoader(true); // Mostrar loader para o container de histórico
            const response = await axios.get('api/get_recent_history.php?limit=5'); // Endpoint hipotético
            if (response.data.success && response.data.history) {
               renderRecentHistoryItems(response.data.history, recentHistoryContainer);
            } else {
                // Não mostra erro aqui, pois pode ser que não haja histórico
                console.warn("Não foi possível carregar histórico recente dinamicamente:", response.data.error);
            }
        } catch (error) {
            console.error("Erro ao buscar histórico recente dinamicamente:", error);
        } finally {
            showGlobalLoader(false);
        }
    }

    function renderRecentHistoryItems(items, containerElement) {
        const listGroup = containerElement.querySelector('ul.list-group');
        if (!listGroup) { // Se não houver ul, cria uma.
            containerElement.innerHTML = ''; // Limpa o container (ex: mensagem "carregando")
            const ul = document.createElement('ul');
            ul.className = 'list-group list-group-flush';
            containerElement.appendChild(ul);
        } else {
            listGroup.innerHTML = ''; // Limpa itens existentes
        }
        
        const targetList = containerElement.querySelector('ul.list-group'); // Pega a ul, seja nova ou existente

        if (items.length === 0) {
            targetList.innerHTML = '<p class="text-muted text-center mt-3 mb-3">Nenhum prompt gerado recentemente.</p>';
            // Esconder o link "Ver Histórico Completo" se não houver itens
            const footerLink = containerElement.closest('.card').querySelector('.card-footer a');
            if(footerLink) footerLink.style.display = 'none';
            return;
        }
        // Mostrar o link "Ver Histórico Completo" se houver itens
        const footerLinkToShow = containerElement.closest('.card').querySelector('.card-footer a');
        if(footerLinkToShow) footerLinkToShow.style.display = 'inline-block';


        items.forEach(item => {
            const inputData = JSON.parse(item.input_parameters || '{}');
            const promptBasePreview = inputData.final_prompt_text || inputData.raw_prompt_text || 'N/A';
            const li = document.createElement('li');
            li.className = 'list-group-item history-item';
            li.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <small class="text-muted">
                        <i class="fas fa-calendar-alt me-1"></i>${new Date(item.created_at).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                    </small>
                    <div>
                        <button class="btn btn-sm btn-outline-info view-history-btn" data-history-id="${item.id}" title="Visualizar Detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-history-btn" data-history-id="${item.id}" title="Excluir">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                <p class="mb-1 mt-1 small">
                    <strong>Input:</strong> ${sanitizeHTML(promptBasePreview.substring(0, 70))}${promptBasePreview.length > 70 ? '...' : ''}
                </p>
                <p class="mb-0 text-break small">
                    <small><strong>Output:</strong> ${sanitizeHTML(item.generated_text_preview.substring(0, 100))}${item.generated_text_preview.length > 100 ? '...' : ''}</small>
                </p>
            `;
            targetList.appendChild(li);
        });
    }
    
    if (recentHistoryContainer) {
        recentHistoryContainer.addEventListener('click', async function(event) {
            const viewButton = event.target.closest('.view-history-btn');
            const deleteButton = event.target.closest('.delete-history-btn');
            const pageCsrfToken = document.querySelector('input[name="csrf_token_generate"]')?.value; // Token do form principal

            if (viewButton) {
                currentViewingHistoryItemIdDashboard = viewButton.dataset.historyId;
                if(historyItemModalBodyForDashboard) historyItemModalBodyForDashboard.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div><p class="mt-3 text-muted">Carregando detalhes...</p></div>';
                if (modalEditBtnDashboard) { // Referência ao botão de editar do modal
                    modalEditBtnDashboard.dataset.historyId = currentViewingHistoryItemIdDashboard; 
                    modalEditBtnDashboard.classList.remove('d-none'); // Mostra o botão de editar
                }
                if(historyItemModalInstanceForDashboard) historyItemModalInstanceForDashboard.show();
                
                try {
                    const response = await axios.get(`api/get_history_item.php?id=${currentViewingHistoryItemIdDashboard}`);
                    if (response.data.success && response.data.item) {
                        renderHistoryItemModalContentForDashboard(response.data.item);
                    } else {
                        if(historyItemModalBodyForDashboard) historyItemModalBodyForDashboard.innerHTML = `<div class="alert alert-danger">${sanitizeHTML(response.data.error || 'Erro ao carregar item.')}</div>`;
                    }
                } catch (error) {
                    console.error("Erro ao buscar item do histórico (dashboard):", error);
                    if(historyItemModalBodyForDashboard) historyItemModalBodyForDashboard.innerHTML = `<div class="alert alert-danger">Falha na comunicação ao buscar detalhes.</div>`;
                }
            }

            if (deleteButton) {
                const historyId = deleteButton.dataset.historyId;
                Swal.fire({
                    title: 'Confirmar Exclusão',
                    text: "Tem certeza que deseja excluir este item do histórico?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Sim, excluir!', cancelButtonText: 'Cancelar',
                    customClass: { popup: 'shadow-lg rounded-3' }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        showGlobalLoader(true);
                        if (!pageCsrfToken) {
                            showGlobalAlert('error', 'Erro de Segurança', 'Token CSRF não encontrado. Recarregue a página.');
                            showGlobalLoader(false); return;
                        }
                        try {
                            const response = await axios.post('api/delete_history_item.php', { id: historyId, csrf_token: pageCsrfToken });
                            if (response.data.success) {
                                showGlobalToast('success', 'Item do histórico excluído.');
                                deleteButton.closest('li.list-group-item').remove();
                                const listGroup = recentHistoryContainer.querySelector('ul.list-group');
                                if (listGroup && listGroup.children.length === 0) {
                                    listGroup.innerHTML = '<p class="text-muted text-center mt-3 mb-3">Nenhum prompt gerado recentemente.</p>';
                                    const footerLink = recentHistoryContainer.closest('.card').querySelector('.card-footer a');
                                    if(footerLink) footerLink.style.display = 'none';
                                }
                            } else { showGlobalAlert('error', 'Erro ao Excluir', sanitizeHTML(response.data.error || 'Não foi possível excluir.')); }
                        } catch (error) { console.error("Erro ao excluir (dashboard):", error); showGlobalAlert('error', 'Erro na Requisição', 'Falha ao excluir.'); }
                        finally { showGlobalLoader(false); }
                    }
                });
            }
        });
    }
    
    function renderHistoryItemModalContentForDashboard(item) { // Renomeada para evitar conflito se history-page.js for incluído junto
        if (!historyItemModalBodyForDashboard) return;
        const inputParams = JSON.parse(item.input_parameters || '{}');
        // ... (Lógica de renderização HTML similar à de history-page.js, mas dentro de historyItemModalBodyForDashboard)
        // Adaptar para mostrar o que é relevante no modal do dashboard.
        // Pode ser um pouco mais conciso que o modal da página de histórico completo.
        let html = `
            <h5><i class="fas fa-file-alt me-2 text-primary"></i>Prompt Enviado à IA:</h5>
            <pre class="bg-light p-3 border rounded mb-3" style="font-size:0.9em; max-height: 200px; overflow-y: auto;">${sanitizeHTML(inputParams.final_prompt_text || inputParams.raw_prompt_text || 'N/A')}</pre>
            
            <h5><i class="fas fa-robot me-2 text-success"></i>Resultado Gerado:</h5>
            <pre class="bg-light p-3 border rounded mb-3" style="font-size:0.9em; max-height: 300px; overflow-y: auto;">${sanitizeHTML(item.generated_text)}</pre>
            <hr class="my-3">
            <p class="text-center"><small class="text-muted">Gerado em: ${new Date(item.created_at).toLocaleString('pt-BR')}</small></p>`;
        historyItemModalBodyForDashboard.innerHTML = html;
    }
    
    // Lógica para os botões de copiar e editar DENTRO do modal de histórico do DASHBOARD
    if(modalCopyInputBtnDashboard && historyItemModalBodyForDashboard) {
        modalCopyInputBtnDashboard.addEventListener('click', () => {
            const inputPres = historyItemModalBodyForDashboard.querySelectorAll('pre');
            if (inputPres.length > 0 && inputPres[0].textContent) {
                navigator.clipboard.writeText(inputPres[0].textContent)
                    .then(() => showGlobalToast('success', 'Input copiado!'))
                    .catch(err => showGlobalAlert('error', 'Falha ao Copiar'));
            }
        });
    }
    if(modalCopyOutputBtnDashboard && historyItemModalBodyForDashboard) {
         modalCopyOutputBtnDashboard.addEventListener('click', () => {
            const outputPres = historyItemModalBodyForDashboard.querySelectorAll('pre');
            if (outputPres.length > 1 && outputPres[1].textContent) {
                navigator.clipboard.writeText(outputPres[1].textContent)
                    .then(() => showGlobalToast('success', 'Output copiado!'))
                    .catch(err => showGlobalAlert('error', 'Falha ao Copiar'));
            }
        });
    }
    if(modalEditBtnDashboard){ // Botão de editar do modal do dashboard
        modalEditBtnDashboard.addEventListener('click', function(){
            const historyIdToEdit = this.dataset.historyId || currentViewingHistoryItemIdDashboard;
            if(historyIdToEdit){
                localStorage.setItem('editHistoryItemId', historyIdToEdit);
                if(historyItemModalInstanceForDashboard) historyItemModalInstanceForDashboard.hide();
                // Rolar para o topo da página para ver o formulário preenchido
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // A lógica de carregar para edição já está no final deste script
                loadHistoryItemForEditing(historyIdToEdit); // Chama diretamente a função
            } else {
                showGlobalToast('warning', 'ID do item não encontrado para edição.');
            }
        });
    }


    // --- LÓGICA DO MODAL DE ASSISTÊNCIA IA ---
    if (aiActionTypeSelect) {
        aiActionTypeSelect.addEventListener('change', function() {
            const selectedAction = this.value;
            if(aiAssistantInputArea) aiAssistantInputArea.classList.add('d-none');
            if(aiAssistantToneSelectorArea) aiAssistantToneSelectorArea.classList.add('d-none');
            if(aiAssistantResultOutputDiv) aiAssistantResultOutputDiv.innerHTML = '';
            if(applyAiAssistantResultBtn) applyAiAssistantResultBtn.classList.add('d-none');
            currentAiAssistantOutput = "";
            currentAiAssistantActionType = selectedAction;

            if (selectedAction === 'expand_idea') {
                if(aiAssistantInputArea) aiAssistantInputArea.classList.remove('d-none');
                if(aiAssistantUserInputLabel) aiAssistantUserInputLabel.textContent = 'Sua ideia curta para expandir:';
                if(aiAssistantUserInput) { aiAssistantUserInput.value = ''; aiAssistantUserInput.placeholder = 'Ex: Um poema sobre a lua para crianças';}
            } else if (selectedAction === 'change_tone') {
                if(aiAssistantInputArea) aiAssistantInputArea.classList.remove('d-none');
                if(aiAssistantUserInputLabel) aiAssistantUserInputLabel.textContent = 'Texto para alterar o tom (opcional, usa prompt principal se vazio):';
                if(aiAssistantUserInput) {aiAssistantUserInput.value = ''; aiAssistantUserInput.placeholder = 'Cole o texto aqui ou deixe em branco.';}
                if(aiAssistantToneSelectorArea) aiAssistantToneSelectorArea.classList.remove('d-none');
            }
        });
    }

    if (runAiAssistantBtn) {
        runAiAssistantBtn.addEventListener('click', async function() {
            // ... (lógica existente de runAiAssistantBtn, sem grandes mudanças) ...
            if (!currentAiAssistantActionType) { showGlobalToast('warning', 'Selecione um tipo de assistência.'); return; }
            if(runAiAssistantBtnSpinner) runAiAssistantBtnSpinner.classList.remove('d-none');
            runAiAssistantBtn.disabled = true;
            if(aiAssistantResultOutputDiv) aiAssistantResultOutputDiv.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-info" role="status"></div><p class="mt-2 text-muted">Assistente IA processando...</p></div>';
            if(applyAiAssistantResultBtn) applyAiAssistantResultBtn.classList.add('d-none');

            let currentPromptForAssistant = '';
            if (ckEditorPromptInstance) currentPromptForAssistant = ckEditorPromptInstance.getData();
            else if (document.getElementById('prompt_main_text_fallback')) currentPromptForAssistant = document.getElementById('prompt_main_text_fallback').value;
            else if (hiddenPromptTextarea) currentPromptForAssistant = hiddenPromptTextarea.value;
            
            const payload = {
                action_type: currentAiAssistantActionType,
                current_prompt_text: currentPromptForAssistant,
                user_input_idea: (currentAiAssistantActionType === 'expand_idea' && aiAssistantUserInput) ? aiAssistantUserInput.value : '',
                new_tone: (currentAiAssistantActionType === 'change_tone' && aiAssistantNewToneSelect) ? aiAssistantNewToneSelect.value : '',
                suggestion_count: (aiSuggestionCountInput) ? parseInt(aiSuggestionCountInput.value) : 3
            };
            if (currentAiAssistantActionType === 'change_tone' && aiAssistantUserInput && aiAssistantUserInput.value.trim() !== '') {
                payload.current_prompt_text = aiAssistantUserInput.value.trim();
            }

            try {
                const response = await axios.post('api/ai_assistant.php', payload);
                if (response.data.success && response.data.assisted_text) {
                    currentAiAssistantOutput = response.data.assisted_text;
                    if (payload.action_type === 'suggest_variations' && currentAiAssistantOutput.includes('---VARIANT---')) {
                        // ... (lógica de renderizar variações com radio buttons) ...
                        const variations = currentAiAssistantOutput.split('---VARIANT---').map(v => v.trim()).filter(Boolean);
                        let variationsHtml = '<p class="mb-2">Selecione uma variação para aplicar ao seu prompt principal:</p><div class="list-group">';
                        variations.forEach((variant, index) => {
                            variationsHtml += `
                                <label class="list-group-item list-group-item-action small p-2">
                                    <input class="form-check-input me-2" type="radio" name="aiVariation" value="${index}">
                                    ${sanitizeHTML(variant).replace(/\n/g, '<br>')}
                                </label>`;
                        });
                        variationsHtml += '</div>';
                        if(aiAssistantResultOutputDiv) aiAssistantResultOutputDiv.innerHTML = variationsHtml;

                    } else {
                        if(aiAssistantResultOutputDiv) aiAssistantResultOutputDiv.innerHTML = sanitizeHTML(currentAiAssistantOutput).replace(/\n/g, '<br>');
                    }
                    if(applyAiAssistantResultBtn) applyAiAssistantResultBtn.classList.remove('d-none');
                } else {
                    if(aiAssistantResultOutputDiv) aiAssistantResultOutputDiv.innerHTML = `<div class="alert alert-danger p-2">${sanitizeHTML(response.data.error || 'Erro desconhecido do assistente.')}</div>`;
                }
            } catch (error) { /* ... (tratamento de erro) ... */
                 console.error("Erro na assistência IA:", error);
                let errorMsg = 'Falha na comunicação com o assistente IA.';
                if (error.response && error.response.data && error.response.data.error) { errorMsg = error.response.data.error;}
                if(aiAssistantResultOutputDiv) aiAssistantResultOutputDiv.innerHTML = `<div class="alert alert-danger p-2">${sanitizeHTML(errorMsg)}</div>`;
            } finally {
                if(runAiAssistantBtnSpinner) runAiAssistantBtnSpinner.classList.add('d-none');
                if(runAiAssistantBtn) runAiAssistantBtn.disabled = false;
            }
        });
    }

    if (applyAiAssistantResultBtn) {
        applyAiAssistantResultBtn.addEventListener('click', function() {
            let textToApply = currentAiAssistantOutput;
            if (currentAiAssistantActionType === 'suggest_variations') {
                const selectedVariationRadio = aiAssistantResultOutputDiv ? aiAssistantResultOutputDiv.querySelector('input[name="aiVariation"]:checked') : null;
                if (selectedVariationRadio) {
                    const variations = currentAiAssistantOutput.split('---VARIANT---').map(v => v.trim()).filter(Boolean);
                    textToApply = variations[parseInt(selectedVariationRadio.value)];
                } else { showGlobalToast('warning', 'Por favor, selecione uma variação.'); return; }
            }

            if (textToApply) {
                if (ckEditorPromptInstance) ckEditorPromptInstance.setData(textToApply);
                else if (document.getElementById('prompt_main_text_fallback')) document.getElementById('prompt_main_text_fallback').value = textToApply;
                else if (hiddenPromptTextarea) hiddenPromptTextarea.value = textToApply;
                if (hiddenPromptTextarea) hiddenPromptTextarea.value = textToApply; // Sincroniza
                
                showGlobalToast('success', 'Resultado da assistência aplicado ao prompt!');
                if(aiAssistanceModalInstance) aiAssistanceModalInstance.hide();
            } else { showGlobalToast('info', 'Nenhum resultado para aplicar.'); }
        });
    }
    
    if (aiAssistanceModalElement) {
        aiAssistanceModalElement.addEventListener('hidden.bs.modal', function () {
            if(aiActionTypeSelect) aiActionTypeSelect.value = '';
            if(aiAssistantInputArea) aiAssistantInputArea.classList.add('d-none');
            if(aiAssistantToneSelectorArea) aiAssistantToneSelectorArea.classList.add('d-none');
            if(aiAssistantUserInput) aiAssistantUserInput.value = '';
            if(aiAssistantResultOutputDiv) aiAssistantResultOutputDiv.innerHTML = '<!-- Resultado da assistência IA aqui -->';
            if(applyAiAssistantResultBtn) applyAiAssistantResultBtn.classList.add('d-none');
            currentAiAssistantOutput = ""; currentAiAssistantActionType = "";
            if(runAiAssistantBtnSpinner) runAiAssistantBtnSpinner.classList.add('d-none');
            if(runAiAssistantBtn) runAiAssistantBtn.disabled = false;
        });
    }

    // --- LÓGICA PARA EDITAR ITEM DO HISTÓRICO (CARREGAR NO FORMULÁRIO) ---
    const editHistoryItemIdFromStorage = localStorage.getItem('editHistoryItemId');
    const urlHashForEdit = window.location.hash;

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
                if (ckEditorPromptInstance) ckEditorPromptInstance.setData(basePromptValue);
                else if (document.getElementById('prompt_main_text_fallback')) document.getElementById('prompt_main_text_fallback').value = basePromptValue;
                else if (hiddenPromptTextarea) hiddenPromptTextarea.value = basePromptValue;
                if (hiddenPromptTextarea) hiddenPromptTextarea.value = basePromptValue;


                const genSettings = inputParams.generation_settings_input || {};
                if (temperatureSlider && genSettings.temperature !== undefined) {
                    temperatureSlider.value = genSettings.temperature;
                    if(tempValueDisplay) tempValueDisplay.textContent = genSettings.temperature;
                    temperatureSlider.dispatchEvent(new Event('input'));
                } else if (temperatureSlider) { // Reset to default if not in history item
                    temperatureSlider.value = 0.7; // Seu valor padrão
                     if(tempValueDisplay) tempValueDisplay.textContent = temperatureSlider.value;
                    temperatureSlider.dispatchEvent(new Event('input'));
                }

                if (maxOutputTokensInput && genSettings.maxOutputTokens !== undefined) {
                    maxOutputTokensInput.value = genSettings.maxOutputTokens;
                } else if (maxOutputTokensInput) {
                    maxOutputTokensInput.value = 1024; // Seu valor padrão
                }


                if (inputParams.template_id_used && promptTemplateSelect) {
                    promptTemplateSelect.value = inputParams.template_id_used;
                    const changeEvent = new Event('change', { bubbles: true });
                    promptTemplateSelect.dispatchEvent(changeEvent); // Isso vai carregar os campos customizados

                    // Precisamos esperar os campos serem criados antes de tentar preenchê-los
                    // Um MutationObserver seria mais robusto, mas setTimeout é mais simples para este exemplo
                    setTimeout(() => {
                        if (inputParams.template_custom_values) {
                            for (const fieldName in inputParams.template_custom_values) {
                                const fieldInput = document.getElementById(`template_field_${fieldName}`);
                                if (fieldInput) {
                                    fieldInput.value = inputParams.template_custom_values[fieldName];
                                }
                            }
                        }
                        showGlobalToast('info', 'Item do histórico carregado para edição.');
                    }, 800); // Ajuste o delay se os campos do template demorarem para renderizar
                } else {
                     showGlobalToast('info', 'Item do histórico carregado para edição.');
                }
                
                if(promptGenerationForm) promptGenerationForm.scrollIntoView({ behavior: 'smooth', block: 'start' });

            } else { showGlobalAlert('error', 'Erro ao Carregar', response.data.error || 'Item do histórico não encontrado.'); }
        } catch (error) {
            console.error('Erro ao carregar item do histórico para edição:', error);
            showGlobalAlert('error', 'Erro na Requisição', 'Não foi possível carregar o item do histórico.');
        } finally {
            showGlobalLoader(false);
            localStorage.removeItem('editHistoryItemId');
            if (window.location.hash.includes('#editHistory') || window.location.hash.includes('#edit')) {
                 history.pushState("", document.title, window.location.pathname + window.location.search);
            }
        }
    }

    if (editHistoryItemIdFromStorage) {
        loadHistoryItemForEditing(editHistoryItemIdFromStorage);
    } else if (urlHashForEdit === '#editHistory' || urlHashForEdit.startsWith('#editHistory_') || urlHashForEdit === '#edit') {
        const idFromHash = urlHashForEdit.split('_')[1] || urlHashForEdit.split('#editHistory')[1] || urlHashForEdit.split('#edit')[1];
        if(idFromHash && !isNaN(parseInt(idFromHash))) {
             loadHistoryItemForEditing(parseInt(idFromHash));
        } else if (localStorage.getItem('editHistoryItemId')) { // Dupla verificação
            loadHistoryItemForEditing(localStorage.getItem('editHistoryItemId'));
        }
    }

}); // Fim do DOMContentLoaded