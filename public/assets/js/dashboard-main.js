// public/assets/js/dashboard-main.js

document.addEventListener('DOMContentLoaded', function () {
    // Elementos do Formulário Principal de Geração
    const promptGenerationForm = document.getElementById('promptGenerationForm');
    const promptTemplateSelect = document.getElementById('promptTemplate');
    const customTemplateFieldsContainer = document.getElementById('customTemplateFieldsContainer');
    // const promptMainTextTextarea = document.getElementById('prompt_main_text'); // Se ainda estiver usando textarea
    const promptMainTextEditorContainer = document.getElementById('prompt_main_text_editor_container'); // Para CKEditor
    const hiddenPromptTextarea = document.getElementById('prompt_main_text_hidden');
    let ckEditorPromptInstance;
    const temperatureSlider = document.getElementById('temperature');
    const tempValueDisplay = document.getElementById('tempValueDisplay');
    const maxOutputTokensInput = document.getElementById('maxOutputTokens');
    const generatePromptBtn = document.getElementById('generatePromptBtn');
    const generateBtnSpinner = generatePromptBtn.querySelector('.spinner-border');

    // Elementos da Saída da IA
    const generatedResultOutputDiv = document.getElementById('generatedResultOutput');
    const copyResultBtn = document.getElementById('copyResultBtn');

    // Elementos do Histórico Recente
    const recentHistoryContainer = document.getElementById('recentHistoryContainer');
    const historyItemModalElement = document.getElementById('historyItemModal');
    const historyItemModalInstance = historyItemModalElement ? new bootstrap.Modal(historyItemModalElement) : null;
    const historyItemModalBody = document.getElementById('historyItemModalBody');
    const copyHistoryInputBtn = document.getElementById('copyHistoryInputBtn'); // No modal de histórico do dashboard
    const copyHistoryOutputBtn = document.getElementById('copyHistoryOutputBtn'); // No modal de histórico do dashboard
    let currentViewingHistoryItemId = null;

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
    const runAiAssistantBtnSpinner = runAiAssistantBtn.querySelector('.spinner-border');
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
                if (hiddenPromptTextarea) { // Sincronização inicial
                    editor.setData(hiddenPromptTextarea.value || '');
                }
                editor.model.document.on('change:data', () => {
                    if (hiddenPromptTextarea) {
                        hiddenPromptTextarea.value = editor.getData();
                    }
                });
            })
            .catch(error => {
                console.error('Erro ao inicializar CKEditor:', error);
                if(hiddenPromptTextarea && promptMainTextEditorContainer) { // Fallback visual
                     promptMainTextEditorContainer.innerHTML = ''; // Limpa o div do editor
                     const fallbackTextarea = document.createElement('textarea');
                     fallbackTextarea.className = 'form-control';
                     fallbackTextarea.id = 'prompt_main_text_fallback'; // Novo ID para evitar conflito
                     fallbackTextarea.name = 'prompt_main_text';
                     fallbackTextarea.rows = 8;
                     fallbackTextarea.placeholder = "Editor avançado falhou. Descreva o que você quer que a IA gere.";
                     fallbackTextarea.required = true;
                     fallbackTextarea.value = hiddenPromptTextarea.value || '';
                     promptMainTextEditorContainer.appendChild(fallbackTextarea);
                     showGlobalToast('warning', 'Editor avançado falhou. Usando campo de texto simples.');
                }
            });
    } else if (typeof ClassicEditor === 'undefined' && promptMainTextEditorContainer) {
        console.warn('CKEditor não está definido. Verifique o script. Usando textarea padrão.');
        // Se o container existe, mas o editor não, podemos criar o textarea dinamicamente ou garantir que o hidden seja usado
        if(hiddenPromptTextarea) hiddenPromptTextarea.style.display = 'block'; hiddenPromptTextarea.rows = 8;
    }


    // --- STATUS DA API KEY ---
    async function checkAndDisplayApiKeyStatus() {
        if (!apiKeyStatusIndicator || !apiKeyStatusText || !apiKeyConfigureLink) return;
        
        apiKeyStatusIndicator.style.display = 'flex'; // Usar flex para alinhar itens no alerta
        apiKeyStatusIndicator.classList.remove('alert-success', 'alert-warning', 'alert-danger', 'alert-info');
        apiKeyStatusIndicator.classList.add('alert-secondary'); // Estado inicial
        apiKeyStatusText.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Verificando status da API Key...';
        apiKeyConfigureLink.style.display = 'none';

        try {
            const response = await axios.get('api/get_api_key_status.php'); // Endpoint criado no Passo 14.6
            apiKeyStatusIndicator.classList.remove('alert-secondary');
            if (response.data.hasApiKey) {
                apiKeyStatusText.textContent = 'Configurada e pronta para uso.';
                apiKeyStatusIndicator.classList.add('alert-success');
                apiKeyConfigureLink.style.display = 'none';
            } else {
                apiKeyStatusText.textContent = 'Não configurada. Alguns recursos podem não funcionar.';
                apiKeyStatusIndicator.classList.add('alert-warning');
                apiKeyConfigureLink.style.display = 'inline';
            }
        } catch (error) {
            console.error("Erro ao verificar status da API Key:", error);
            apiKeyStatusIndicator.classList.remove('alert-secondary');
            apiKeyStatusText.textContent = 'Não foi possível verificar o status da API Key.';
            apiKeyStatusIndicator.classList.add('alert-danger');
            apiKeyConfigureLink.style.display = 'inline';
        }
    }
    checkAndDisplayApiKeyStatus();


    // --- LÓGICA DE TEMPLATES ---
    if (promptTemplateSelect) {
        promptTemplateSelect.addEventListener('change', async function () {
            const templateId = this.value;
            customTemplateFieldsContainer.innerHTML = ''; 
            
            let initialPromptStructure = '';
            if (ckEditorPromptInstance) {
                ckEditorPromptInstance.setData('');
            } else if (document.getElementById('prompt_main_text_fallback')) { // Se o fallback textarea existe
                document.getElementById('prompt_main_text_fallback').value = '';
            } else if (hiddenPromptTextarea) { // Fallback para o hidden (se CKEditor não carregou)
                 hiddenPromptTextarea.value = '';
            }


            if (!templateId) {
                // Placeholder do CKEditor ou textarea deve ser redefinido
                if (ckEditorPromptInstance) {
                    // O placeholder do CKEditor é definido na inicialização. Para resetar, pode-se limpar
                    // e talvez re-focar para mostrar o placeholder se estiver vazio.
                } else if (document.getElementById('prompt_main_text_fallback')) {
                     document.getElementById('prompt_main_text_fallback').placeholder = "Descreva o que você quer que a IA gere...";
                }
                return;
            }

            showGlobalLoader(true);
            try {
                const response = await axios.get(`api/get_template_details.php?id=${templateId}`);
                if (response.data.success && response.data.template) {
                    const template = response.data.template;
                    initialPromptStructure = template.prompt_structure || '';
                    
                    if (ckEditorPromptInstance) {
                        ckEditorPromptInstance.setData(initialPromptStructure);
                    } else if (document.getElementById('prompt_main_text_fallback')) {
                        document.getElementById('prompt_main_text_fallback').value = initialPromptStructure;
                    } else if (hiddenPromptTextarea) {
                        hiddenPromptTextarea.value = initialPromptStructure;
                    }


                    if (template.custom_fields_decoded && Array.isArray(template.custom_fields_decoded)) {
                        template.custom_fields_decoded.forEach(field => {
                            const formGroup = document.createElement('div');
                            formGroup.className = 'mb-3 border p-3 rounded bg-light-subtle'; // Estilo para destacar campos de template

                            const label = document.createElement('label');
                            label.htmlFor = `template_field_${field.name}`;
                            label.className = 'form-label fw-medium';
                            label.textContent = field.label || field.name;
                            if (field.required) {
                                const requiredSpan = document.createElement('span');
                                requiredSpan.className = 'text-danger ms-1';
                                requiredSpan.textContent = '*';
                                label.appendChild(requiredSpan);
                            }
                            formGroup.appendChild(label);

                            let inputElement;
                            // ... (código para criar inputElement como no templates-manager.js) ...
                            // Vou simplificar aqui para brevidade, mas a lógica de criação dos campos é a mesma.
                            // Certifique-se de copiar a lógica completa de criação de campos de templates-manager.js
                            // ou refatorar para uma função compartilhada.
                            // --- INÍCIO DA LÓGICA DE CRIAÇÃO DE CAMPO (COPIAR/ADAPTAR DE templates-manager.js) ---
                            switch (field.type) {
                                case 'textarea':
                                    inputElement = document.createElement('textarea');
                                    inputElement.rows = 3;
                                    break;
                                case 'number':
                                    inputElement = document.createElement('input');
                                    inputElement.type = 'number';
                                    if (field.min !== undefined) inputElement.min = field.min;
                                    if (field.max !== undefined) inputElement.max = field.max;
                                    break;
                                case 'select':
                                    inputElement = document.createElement('select');
                                    if (field.options && Array.isArray(field.options)) {
                                        const defaultOption = document.createElement('option');
                                        defaultOption.value = "";
                                        defaultOption.textContent = `-- Selecione ${field.label || field.name} --`;
                                        inputElement.appendChild(defaultOption);
                                        field.options.forEach(optValue => { // Assumindo que options é array de strings
                                            const optionEl = document.createElement('option');
                                            optionEl.value = optValue;
                                            optionEl.textContent = optValue;
                                            inputElement.appendChild(optionEl);
                                        });
                                    }
                                    break;
                                case 'text':
                                default:
                                    inputElement = document.createElement('input');
                                    inputElement.type = 'text';
                                    break;
                            }
                            inputElement.className = 'form-control form-control-sm';
                            inputElement.id = `template_field_${field.name}`;
                            inputElement.name = `template_fields[${field.name}]`;
                            if (field.placeholder) inputElement.placeholder = field.placeholder;
                            if (field.default !== undefined) inputElement.value = field.default;
                            if (field.required) inputElement.required = true;
                            // --- FIM DA LÓGICA DE CRIAÇÃO DE CAMPO ---
                            formGroup.appendChild(inputElement);
                            customTemplateFieldsContainer.appendChild(formGroup);
                        });
                    }
                } else {
                    showGlobalToast('error', response.data.error || 'Erro ao carregar template.');
                }
            } catch (error) {
                console.error('Erro ao buscar template:', error);
                showGlobalToast('error', 'Falha na comunicação ao carregar template.');
            } finally {
                showGlobalLoader(false);
            }
        });
    }
     // Verifica se há um template selecionado para usar ao carregar o dashboard
    const selectedTemplateIdToUse = localStorage.getItem('selectedTemplateIdToUse');
    if (selectedTemplateIdToUse && promptTemplateSelect) {
        promptTemplateSelect.value = selectedTemplateIdToUse;
        const changeEvent = new Event('change', { bubbles: true });
        promptTemplateSelect.dispatchEvent(changeEvent);
        localStorage.removeItem('selectedTemplateIdToUse');
    }


    // --- LÓGICA DE GERAÇÃO DE PROMPT ---
    if (temperatureSlider && tempValueDisplay) {
        temperatureSlider.addEventListener('input', function () {
            tempValueDisplay.textContent = this.value;
            tempValueDisplay.classList.remove('bg-secondary'); // Remove classe padrão
            if(this.value >= 1.5) tempValueDisplay.className = 'badge bg-danger';
            else if (this.value >= 0.9) tempValueDisplay.className = 'badge bg-warning';
            else if (this.value <= 0.3) tempValueDisplay.className = 'badge bg-info';
            else tempValueDisplay.className = 'badge bg-primary';
        });
        // Trigger inicial para cor
        temperatureSlider.dispatchEvent(new Event('input'));
    }

    if (promptGenerationForm) {
        promptGenerationForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            generateBtnSpinner.classList.remove('d-none');
            generatePromptBtn.disabled = true;
            generatedResultOutputDiv.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-secondary" role="status"></div><p class="mt-2 text-muted">A IA está pensando...</p></div>';
            copyResultBtn.classList.add('d-none');

            let rawPromptText = '';
            if (ckEditorPromptInstance) {
                rawPromptText = ckEditorPromptInstance.getData();
            } else if (document.getElementById('prompt_main_text_fallback')) {
                rawPromptText = document.getElementById('prompt_main_text_fallback').value;
            } else if (hiddenPromptTextarea) {
                rawPromptText = hiddenPromptTextarea.value;
            }
            if (hiddenPromptTextarea) hiddenPromptTextarea.value = rawPromptText;


            let finalPromptText = rawPromptText;
            const templateCustomValues = {};
            let allRequiredFieldsFilled = true;

            const customFields = customTemplateFieldsContainer.querySelectorAll('[name^="template_fields["]');
            if (customFields.length > 0) {
                customFields.forEach(field => {
                    const fieldName = field.name.match(/template_fields\[(.*?)\]/)[1];
                    templateCustomValues[fieldName] = field.value;
                    if (field.required && field.value.trim() === '') {
                        allRequiredFieldsFilled = false;
                        field.classList.add('is-invalid'); // Marcar campo inválido
                        // Adicionar mensagem de erro específica se não existir
                        let feedback = field.parentNode.querySelector('.invalid-feedback');
                        if (!feedback) {
                            feedback = document.createElement('div');
                            feedback.className = 'invalid-feedback d-block';
                            field.parentNode.appendChild(feedback);
                        }
                        feedback.textContent = 'Este campo do template é obrigatório.';
                    } else {
                        field.classList.remove('is-invalid');
                    }
                    const placeholder = new RegExp(`\\{\\{\\s*${fieldName}\\s*\\}\\}`, 'g');
                    finalPromptText = finalPromptText.replace(placeholder, field.value);
                });
            }

            if (!allRequiredFieldsFilled) {
                showGlobalAlert('error', 'Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios do template marcado com *.');
                generateBtnSpinner.classList.add('d-none');
                generatePromptBtn.disabled = false;
                return;
            }
            if (rawPromptText.trim() === ''){
                showGlobalAlert('error', 'Prompt Vazio', 'O campo do prompt base não pode estar vazio.');
                 generateBtnSpinner.classList.add('d-none');
                generatePromptBtn.disabled = false;
                return;
            }

            const payload = {
                csrf_token_generate: this.querySelector('input[name="csrf_token_generate"]').value,
                raw_prompt_text: rawPromptText,
                final_prompt_text: finalPromptText,
                template_id_used: promptTemplateSelect ? promptTemplateSelect.value : null,
                template_custom_values: templateCustomValues,
                temperature: parseFloat(temperatureSlider.value),
                maxOutputTokens: parseInt(maxOutputTokensInput.value)
            };

            try {
                const response = await axios.post('api/generate_prompt.php', payload);
                if (response.data.success && response.data.generated_text) {
                    generatedResultOutputDiv.innerHTML = ''; // Limpa "pensando..."
                    // Para renderizar markdown, usar uma biblioteca como Marked.js
                    // Por ora, apenas texto com quebras de linha.
                    // Se quiser tratar como markdown:
                    // if (typeof marked !== 'undefined') {
                    //    generatedResultOutputDiv.innerHTML = marked.parse(response.data.generated_text);
                    // } else {
                    //    generatedResultOutputDiv.textContent = response.data.generated_text;
                    // }
                    generatedResultOutputDiv.textContent = response.data.generated_text; // Simples para agora
                    copyResultBtn.classList.remove('d-none');
                    showGlobalToast('success', 'Prompt gerado com sucesso!');
                    fetchRecentHistory(); 
                } else {
                    generatedResultOutputDiv.textContent = '';
                    showGlobalAlert('error', 'Erro ao Gerar Prompt', response.data.error || 'Erro desconhecido do servidor.');
                    // Atualizar status da API Key se o erro for relacionado a ela
                    if (response.data.error && (response.data.error.toLowerCase().includes('api key') || response.data.error.toLowerCase().includes('chave da api'))) {
                        apiKeyStatusText.textContent = 'Inválida ou com problemas.';
                        apiKeyStatusIndicator.className = 'alert alert-danger small py-2 mb-3 d-flex align-items-center justify-content-between'; // d-flex para alinhar
                        apiKeyConfigureLink.style.display = 'inline';
                    }
                }
            } catch (error) {
                console.error('Erro na requisição de geração:', error);
                generatedResultOutputDiv.textContent = '';
                let errorMsg = 'Falha na comunicação com o servidor.';
                if (error.response && error.response.data && error.response.data.error) {
                    errorMsg = error.response.data.error;
                     if (error.response.status === 401 || (errorMsg.toLowerCase().includes('api key') || errorMsg.toLowerCase().includes('chave da api'))) {
                        apiKeyStatusText.textContent = 'Não configurada ou inválida.';
                        apiKeyStatusIndicator.className = 'alert alert-danger small py-2 mb-3 d-flex align-items-center justify-content-between';
                        apiKeyConfigureLink.style.display = 'inline';
                    }
                } else if (error.message) {
                    errorMsg = error.message;
                }
                showGlobalAlert('error', 'Erro na Requisição', errorMsg);
            } finally {
                generateBtnSpinner.classList.add('d-none');
                generatePromptBtn.disabled = false;
            }
        });
    }

    if (copyResultBtn) {
        copyResultBtn.addEventListener('click', function () {
            // Se estiver usando HTML (ex: com marked.js), copiar o texto puro.
            const textToCopy = generatedResultOutputDiv.textContent || generatedResultOutputDiv.innerText;
            if (textToCopy.trim() === '') {
                showGlobalToast('info', 'Nada para copiar.');
                return;
            }
            navigator.clipboard.writeText(textToCopy)
                .then(() => showGlobalToast('success', 'Resultado copiado para a área de transferência!'))
                .catch(err => {
                    console.error('Erro ao copiar resultado:', err);
                    showGlobalAlert('error', 'Falha ao Copiar', 'Não foi possível copiar. Verifique as permissões do navegador.');
                });
        });
    }

    // --- LÓGICA DO HISTÓRICO RECENTE (FUNÇÕES REUTILIZÁVEIS) ---
    async function fetchRecentHistory() {
        if (!recentHistoryContainer) return;
        // Esta função pode ser chamada para atualizar o histórico no dashboard.
        // Por simplicidade, o dashboard.php já carrega os 5 mais recentes.
        // Para uma atualização dinâmica real após gerar, este método faria uma chamada AJAX.
        // Ex: const response = await axios.get('api/get_recent_history.php?limit=5');
        // e depois chamaria renderRecentHistoryItems(response.data.history);
        // Por agora, vamos simular um recarregamento ou apenas logar.
        console.log("Tentativa de atualizar histórico recente (implementar busca AJAX se necessário).");
        // Para forçar recarregamento da lista no dashboard (simples mas pode não ser ideal)
        // window.location.reload(); // Descomente se quiser recarregar a página toda
    }

    function renderRecentHistoryItems(items, containerElement) { // Se for atualizar dinamicamente
        const listGroup = containerElement.querySelector('ul.list-group');
        if (!listGroup) return;
        listGroup.innerHTML = ''; // Limpa
        if (items.length === 0) {
            containerElement.innerHTML = '<p class="text-muted text-center mt-3">Nenhum prompt gerado ainda.</p>';
            return;
        }
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
                <p class="mb-1 mt-1">
                    <strong>Input:</strong> ${sanitizeHTML(promptBasePreview.substring(0, 70))}${promptBasePreview.length > 70 ? '...' : ''}
                </p>
                <p class="mb-0 text-break">
                    <small><strong>Output:</strong> ${sanitizeHTML(item.generated_text_preview.substring(0, 100))}${item.generated_text_preview.length > 100 ? '...' : ''}</small>
                </p>
            `;
            listGroup.appendChild(li);
        });
    }
    
    // Delegação de eventos para botões de histórico no dashboard
    if (recentHistoryContainer) {
        recentHistoryContainer.addEventListener('click', async function(event) {
            const viewButton = event.target.closest('.view-history-btn');
            const deleteButton = event.target.closest('.delete-history-btn');
            const pageCsrfToken = document.querySelector('input[name="csrf_token_generate"]')?.value;

            if (viewButton) {
                currentViewingHistoryItemId = viewButton.dataset.historyId;
                if(historyItemModalBody) historyItemModalBody.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div><p class="mt-3 text-muted">Carregando detalhes...</p></div>';
                //const modalEditBtn = document.getElementById('modalEditHistoryItemBtn'); // O do dashboard não tem esse botão por padrão
                //if (modalEditBtn) modalEditBtn.classList.add('d-none');
                if(historyItemModalInstance) historyItemModalInstance.show();
                
                try {
                    const response = await axios.get(`api/get_history_item.php?id=${currentViewingHistoryItemId}`);
                    if (response.data.success && response.data.item) {
                        renderHistoryItemModalContent(response.data.item, historyItemModalBody); // Passa o body do modal
                        //if (modalEditBtn) modalEditBtn.classList.remove('d-none');
                    } else {
                        if(historyItemModalBody) historyItemModalBody.innerHTML = `<div class="alert alert-danger">${response.data.error || 'Erro ao carregar item.'}</div>`;
                    }
                } catch (error) {
                    console.error("Erro ao buscar item do histórico:", error);
                    if(historyItemModalBody) historyItemModalBody.innerHTML = `<div class="alert alert-danger">Falha na comunicação ao buscar detalhes.</div>`;
                }
            }

            if (deleteButton) {
                const historyId = deleteButton.dataset.historyId;
                Swal.fire({ /* ... config de confirmação ... */ }).then(async (result) => {
                    if (result.isConfirmed) {
                        showGlobalLoader(true);
                        try {
                            const response = await axios.post('api/delete_history_item.php', { id: historyId, csrf_token: pageCsrfToken });
                            if (response.data.success) {
                                showGlobalToast('success', 'Item do histórico excluído.');
                                deleteButton.closest('li.list-group-item').remove();
                                if (recentHistoryContainer.querySelectorAll('li.list-group-item').length === 0) {
                                    recentHistoryContainer.querySelector('ul.list-group').innerHTML = '<p class="text-muted text-center mt-3">Nenhum prompt gerado ainda.</p>';
                                }
                            } else { /* ... tratamento de erro ... */ }
                        } catch (error) { /* ... tratamento de erro ... */ }
                        finally { showGlobalLoader(false); }
                    }
                });
            }
        });
    }
    
    // Função para renderizar conteúdo no modal de histórico (pode ser a mesma de history-page.js ou adaptada)
    function renderHistoryItemModalContent(item, modalBodyElement) {
        if (!modalBodyElement) return;
         const inputParams = JSON.parse(item.input_parameters || '{}');
         const geminiParams = JSON.parse(item.gemini_parameters_used || '{}');
         // ... (código HTML para renderizar detalhes do item, similar ao de history-page.js) ...
         // Simplificado para este exemplo:
         let html = `<h5>Prompt Enviado:</h5><pre>${sanitizeHTML(inputParams.final_prompt_text || inputParams.raw_prompt_text || 'N/A')}</pre>
                     <h5>Resultado:</h5><pre>${sanitizeHTML(item.generated_text)}</pre>
                     <p><small>Data: ${new Date(item.created_at).toLocaleString('pt-BR')}</small></p>`;
         modalBodyElement.innerHTML = html;
    }
    
    // Copiar do modal de histórico (se os botões estiverem no modal do dashboard)
    if(copyHistoryInputBtn) { /* ... mesma lógica de history-page.js ... */ }
    if(copyHistoryOutputBtn) { /* ... mesma lógica de history-page.js ... */ }


    // --- LÓGICA DO MODAL DE ASSISTÊNCIA IA ---
    if (aiActionTypeSelect) { /* ... (código já existente, sem grandes mudanças aqui para UX, exceto a limpeza do modal) ... */ }
    if (runAiAssistantBtn) { /* ... (código já existente) ... */ }
    if (applyAiAssistantResultBtn) {
        applyAiAssistantResultBtn.addEventListener('click', function() {
            // ... (lógica existente para aplicar) ...
            if (textToApply) {
                if (ckEditorPromptInstance) {
                    ckEditorPromptInstance.setData(textToApply);
                } else if (document.getElementById('prompt_main_text_fallback')) {
                    document.getElementById('prompt_main_text_fallback').value = textToApply;
                } else if (hiddenPromptTextarea) {
                    hiddenPromptTextarea.value = textToApply;
                }
                showGlobalToast('success', 'Resultado da assistência aplicado ao prompt!');
                if(aiAssistanceModalInstance) aiAssistanceModalInstance.hide(); // Fecha o modal
            } else { /* ... */ }
        });
    }
    
    // Limpar modal de assistência ao fechar
    if (aiAssistanceModalElement) {
        aiAssistanceModalElement.addEventListener('hidden.bs.modal', function () {
            if(aiActionTypeSelect) aiActionTypeSelect.value = '';
            if(aiAssistantInputArea) aiAssistantInputArea.classList.add('d-none');
            if(aiAssistantToneSelectorArea) aiAssistantToneSelectorArea.classList.add('d-none');
            if(aiAssistantUserInput) aiAssistantUserInput.value = '';
            if(aiAssistantResultOutputDiv) aiAssistantResultOutputDiv.innerHTML = '<!-- Resultado da assistência IA aqui -->';
            if(applyAiAssistantResultBtn) applyAiAssistantResultBtn.classList.add('d-none');
            currentAiAssistantOutput = "";
            currentAiAssistantActionType = "";
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

                // Limpar campos de template e prompt base atuais
                if (promptTemplateSelect) promptTemplateSelect.value = '';
                customTemplateFieldsContainer.innerHTML = '';
                
                let basePromptValue = inputParams.raw_prompt_text || '';
                if (ckEditorPromptInstance) {
                   ckEditorPromptInstance.setData(basePromptValue);
                } else if (document.getElementById('prompt_main_text_fallback')) {
                   document.getElementById('prompt_main_text_fallback').value = basePromptValue;
                } else if (hiddenPromptTextarea) {
                   hiddenPromptTextarea.value = basePromptValue;
                }


                const genSettings = inputParams.generation_settings_input || {};
                if (temperatureSlider && genSettings.temperature !== undefined) {
                    temperatureSlider.value = genSettings.temperature;
                    if(tempValueDisplay) tempValueDisplay.textContent = genSettings.temperature;
                    temperatureSlider.dispatchEvent(new Event('input')); // Para atualizar a cor do badge
                }
                if (maxOutputTokensInput && genSettings.maxOutputTokens !== undefined) {
                    maxOutputTokensInput.value = genSettings.maxOutputTokens;
                }

                if (inputParams.template_id_used && promptTemplateSelect) {
                    promptTemplateSelect.value = inputParams.template_id_used;
                    const changeEvent = new Event('change', { bubbles: true });
                    promptTemplateSelect.dispatchEvent(changeEvent);

                    setTimeout(() => { // Espera os campos do template serem criados
                        if (inputParams.template_custom_values) {
                            for (const fieldName in inputParams.template_custom_values) {
                                const fieldInput = document.getElementById(`template_field_${fieldName}`);
                                if (fieldInput) {
                                    fieldInput.value = inputParams.template_custom_values[fieldName];
                                }
                            }
                        }
                        showGlobalToast('info', 'Item do histórico carregado para edição no formulário.');
                    }, 700); // Aumentei um pouco o delay para garantir
                } else {
                     showGlobalToast('info', 'Item do histórico carregado para edição no formulário.');
                }
                
                // Scroll para o topo do formulário
                if(promptGenerationForm) promptGenerationForm.scrollIntoView({ behavior: 'smooth' });

            } else {
                showGlobalAlert('error', 'Erro ao Carregar', response.data.error || 'Item do histórico não encontrado.');
            }
        } catch (error) {
            console.error('Erro ao carregar item do histórico para edição:', error);
            showGlobalAlert('error', 'Erro na Requisição', 'Não foi possível carregar o item do histórico para edição.');
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
        const idFromHash = urlHashForEdit.split('_')[1];
        if(idFromHash) loadHistoryItemForEditing(idFromHash);
        // Se não houver ID no hash mas o hash existir, poderia tentar pegar do localStorage
        // Mas a lógica acima já cobre isso.
    }

}); // Fim do DOMContentLoaded