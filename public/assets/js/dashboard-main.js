// public/assets/js/dashboard-main.js

// ... outras declarações de variáveis ...
const promptMainTextEditorContainer = document.getElementById('prompt_main_text_editor_container');
const hiddenPromptTextarea = document.getElementById('prompt_main_text_hidden'); // Referência ao textarea oculto
let ckEditorPromptInstance; // Variável para a instância do CKEditor
// ...
document.addEventListener('DOMContentLoaded', function () {
    // Elementos do Formulário Principal de Geração
    const promptGenerationForm = document.getElementById('promptGenerationForm');
    const promptTemplateSelect = document.getElementById('promptTemplate');
    const customTemplateFieldsContainer = document.getElementById('customTemplateFieldsContainer');
    const promptMainTextTextarea = document.getElementById('prompt_main_text'); // Ou o ID do container do CKEditor
    // let ckEditorPromptInstance; // Descomente se usar CKEditor
    const temperatureSlider = document.getElementById('temperature');
    const tempValueDisplay = document.getElementById('tempValueDisplay');
    const maxOutputTokensInput = document.getElementById('maxOutputTokens');
    const generatePromptBtn = document.getElementById('generatePromptBtn');
    const generateBtnSpinner = generatePromptBtn.querySelector('.spinner-border');

    // Elementos da Saída da IA
    const generatedResultOutputDiv = document.getElementById('generatedResultOutput');
    const copyResultBtn = document.getElementById('copyResultBtn');

    // Elementos do Histórico
    const recentHistoryContainer = document.getElementById('recentHistoryContainer');
    const historyItemModal = new bootstrap.Modal(document.getElementById('historyItemModal'));
    const historyItemModalBody = document.getElementById('historyItemModalBody');
    const copyHistoryInputBtn = document.getElementById('copyHistoryInputBtn');
    const copyHistoryOutputBtn = document.getElementById('copyHistoryOutputBtn');
    let currentViewingHistoryItemId = null;


    // Elementos do Modal de Assistência IA
    const aiAssistanceModal = new bootstrap.Modal(document.getElementById('aiAssistanceModal'));
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

    // --- INICIALIZAÇÃO CKEDITOR (Opcional) ---
    // if (document.getElementById('prompt_main_text_editor')) { // Se o ID do container do editor for este
    //     ClassicEditor
    //         .create(document.querySelector('#prompt_main_text_editor'), {
    //             // Configurações do CKEditor aqui (toolbar, plugins, etc.)
    //             toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'undo', 'redo'],
    //             language: 'pt-br' // Se tiver o pacote de idioma
    //         })
    //         .then(editor => {
    //             ckEditorPromptInstance = editor;
    //             console.log('CKEditor para prompt principal inicializado.');
    //         })
    //         .catch(error => {
    //             console.error('Erro ao inicializar CKEditor para prompt principal:', error);
    //         });
    // }


    // --- LÓGICA DE TEMPLATES ---
    if (promptTemplateSelect) {
        promptTemplateSelect.addEventListener('change', async function () {
            const templateId = this.value;
            customTemplateFieldsContainer.innerHTML = ''; // Limpa campos anteriores
            if (!templateId) {
                // promptMainTextTextarea.value = ''; // Limpa o prompt base se nenhum template for selecionado
                // if (ckEditorPromptInstance) ckEditorPromptInstance.setData('');
                promptMainTextTextarea.value = ''; // Para textarea
                promptMainTextTextarea.placeholder = "Descreva o que você quer que a IA gere. Use {{placeholders}} se estiver usando um template.";
                return;
            }

            showGlobalLoader(true);
            try {
                const response = await axios.get(`api/get_template_details.php?id=${templateId}`);
                if (response.data.success && response.data.template) {
                    const template = response.data.template;
                    // if (ckEditorPromptInstance) ckEditorPromptInstance.setData(template.prompt_structure || ''); else 
                    promptMainTextTextarea.value = template.prompt_structure || '';
                    promptMainTextTextarea.placeholder = "Estrutura do template carregada. Preencha os campos personalizados abaixo se houver.";


                    if (template.custom_fields_decoded && Array.isArray(template.custom_fields_decoded)) {
                        template.custom_fields_decoded.forEach(field => {
                            const formGroup = document.createElement('div');
                            formGroup.className = 'mb-3';

                            const label = document.createElement('label');
                            label.htmlFor = `template_field_${field.name}`;
                            label.className = 'form-label';
                            label.textContent = field.label || field.name;
                            if (field.required) {
                                const requiredSpan = document.createElement('span');
                                requiredSpan.className = 'text-danger';
                                requiredSpan.textContent = '*';
                                label.appendChild(requiredSpan);
                            }
                            formGroup.appendChild(label);

                            let inputElement;
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
                                        field.options.forEach(opt => {
                                            const optionEl = document.createElement('option');
                                            optionEl.value = typeof opt === 'string' ? opt : opt.value;
                                            optionEl.textContent = typeof opt === 'string' ? opt : opt.label;
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
                            inputElement.name = `template_fields[${field.name}]`; // Para fácil coleta no backend
                            if (field.placeholder) inputElement.placeholder = field.placeholder;
                            if (field.default !== undefined) inputElement.value = field.default;
                            if (field.required) inputElement.required = true;

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

    // --- LÓGICA DE GERAÇÃO DE PROMPT ---
    if (temperatureSlider && tempValueDisplay) {
        temperatureSlider.addEventListener('input', function () {
            tempValueDisplay.textContent = this.value;
        });
    }

    if (promptGenerationForm) {
        promptGenerationForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            generateBtnSpinner.classList.remove('d-none');
            generatePromptBtn.disabled = true;
            generatedResultOutputDiv.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-secondary" role="status"></div><p class="mt-2 text-muted">A IA está pensando...</p></div>';
            copyResultBtn.classList.add('d-none');

            let rawPromptText = promptMainTextTextarea.value; // Para textarea
            // if (ckEditorPromptInstance) rawPromptText = ckEditorPromptInstance.getData();

            let finalPromptText = rawPromptText;
            const templateCustomValues = {};

            // Substituir placeholders se houver campos de template
            const customFields = customTemplateFieldsContainer.querySelectorAll('[name^="template_fields["]');
            if (customFields.length > 0) {
                customFields.forEach(field => {
                    const fieldName = field.name.match(/template_fields\[(.*?)\]/)[1];
                    templateCustomValues[fieldName] = field.value;
                    const placeholder = new RegExp(`\\{\\{\\s*${fieldName}\\s*\\}\\}`, 'g');
                    finalPromptText = finalPromptText.replace(placeholder, field.value);
                });
            }
            
            const payload = {
                csrf_token_generate: this.querySelector('input[name="csrf_token_generate"]').value,
                raw_prompt_text: rawPromptText, // O que o usuário digitou ou a estrutura do template
                final_prompt_text: finalPromptText, // O prompt após substituições
                template_id_used: promptTemplateSelect ? promptTemplateSelect.value : null,
                template_custom_values: templateCustomValues,
                temperature: parseFloat(temperatureSlider.value),
                maxOutputTokens: parseInt(maxOutputTokensInput.value)
                // Adicionar outros parâmetros como topK, topP se implementados
            };

            try {
                const response = await axios.post('api/generate_prompt.php', payload);
                if (response.data.success && response.data.generated_text) {
                    generatedResultOutputDiv.textContent = response.data.generated_text;
                    copyResultBtn.classList.remove('d-none');
                    showGlobalToast('success', 'Prompt gerado com sucesso!');
                    fetchRecentHistory(); // Atualiza o histórico na página
                } else {
                    generatedResultOutputDiv.textContent = '';
                    showGlobalAlert('error', 'Erro ao Gerar Prompt', response.data.error || 'Erro desconhecido do servidor.');
                }
            } catch (error) {
                console.error('Erro na requisição de geração:', error);
                generatedResultOutputDiv.textContent = '';
                let errorMsg = 'Falha na comunicação com o servidor.';
                if (error.response && error.response.data && error.response.data.error) {
                    errorMsg = error.response.data.error;
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
            if (generatedResultOutputDiv.textContent.trim() === '') {
                showGlobalToast('info', 'Nada para copiar.');
                return;
            }
            navigator.clipboard.writeText(generatedResultOutputDiv.textContent)
                .then(() => showGlobalToast('success', 'Resultado copiado!'))
                .catch(err => {
                    console.error('Erro ao copiar resultado:', err);
                    showGlobalAlert('error', 'Falha ao Copiar', 'Não foi possível copiar o texto para a área de transferência.');
                });
        });
    }

    // --- LÓGICA DO HISTÓRICO ---
    async function fetchRecentHistory() {
        if (!recentHistoryContainer) return;
        try {
            // Para atualizar o histórico, precisaríamos de um endpoint que retorne HTML ou dados para renderizar.
            // Por simplicidade, vamos apenas recarregar a parte do histórico ou a página inteira se a atualização for complexa.
            // Exemplo: buscar os últimos 5 itens e renderizar.
            // const response = await axios.get('api/get_recent_history.php?limit=5');
            // if (response.data.success && response.data.history) {
            //    renderHistoryItems(response.data.history, recentHistoryContainer.querySelector('ul.list-group'));
            // }
            // Por ora, uma forma mais simples é indicar que o usuário pode ver o histórico completo.
            // Ou, para uma atualização simples, pode-se adicionar o novo item no topo da lista localmente,
            // mas isso não reflete exclusões ou paginação real.
            // Para este MVP, a atualização da lista de histórico após gerar um novo prompt
            // pode ser feita recarregando a página ou esperando que o usuário navegue.
            // Se for implementar atualização dinâmica:
            // 1. Criar 'api/get_recent_history.php'
            // 2. Este JS chama o endpoint e usa uma função 'renderHistoryItems' para atualizar o DOM.
            console.log("Histórico atualizado (simulado). Implementar busca e renderização dinâmica se necessário.");
        } catch (error) {
            console.error("Erro ao buscar histórico recente:", error);
        }
    }

    // Delegação de eventos para botões de histórico (visualizar, excluir)
    if (recentHistoryContainer) {
        recentHistoryContainer.addEventListener('click', async function(event) {
            const viewButton = event.target.closest('.view-history-btn');
            const deleteButton = event.target.closest('.delete-history-btn');

            if (viewButton) {
                currentViewingHistoryItemId = viewButton.dataset.historyId;
                historyItemModalBody.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Carregando detalhes...</p></div>';
                historyItemModal.show();
                try {
                    const response = await axios.get(`api/get_history_item.php?id=${currentViewingHistoryItemId}`);
                    if (response.data.success && response.data.item) {
                        renderHistoryItemModal(response.data.item);
                    } else {
                        historyItemModalBody.innerHTML = `<div class="alert alert-danger">${response.data.error || 'Erro ao carregar item.'}</div>`;
                    }
                } catch (error) {
                    console.error("Erro ao buscar item do histórico:", error);
                    historyItemModalBody.innerHTML = `<div class="alert alert-danger">Falha na comunicação ao buscar detalhes.</div>`;
                }
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
                    cancelButtonText: 'Cancelar'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        showGlobalLoader(true);
                        try {
                            const response = await axios.post('api/delete_history_item.php', { id: historyId, csrf_token_delete: document.querySelector('input[name="csrf_token_generate"]').value }); // Reutilizar token ou gerar um específico
                            if (response.data.success) {
                                showGlobalToast('success', 'Item do histórico excluído.');
                                deleteButton.closest('li.list-group-item').remove(); // Remove o item da UI
                                if (recentHistoryContainer.querySelectorAll('li.list-group-item').length === 0) {
                                    recentHistoryContainer.innerHTML = '<p class="text-muted text-center mt-3">Nenhum prompt gerado ainda.</p>';
                                }
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
    }
    
    function renderHistoryItemModal(item) {
        const inputParams = JSON.parse(item.input_parameters || '{}');
        const geminiParams = JSON.parse(item.gemini_parameters_used || '{}');

        let html = `
            <h5>Prompt Enviado à IA:</h5>
            <pre class="bg-light p-2 border rounded mb-3" style="font-size:0.9em;">${sanitizeHTML(inputParams.final_prompt_text || inputParams.raw_prompt_text || 'N/A')}</pre>
            
            <h5>Resultado Gerado:</h5>
            <pre class="bg-light p-2 border rounded mb-3" style="font-size:0.9em;">${sanitizeHTML(item.generated_text)}</pre>
            
            <hr>
            <h6>Detalhes do Input:</h6>
            <ul>
                <li><strong>Prompt Base/Estrutura:</strong> <pre style="font-size:0.85em; white-space:pre-wrap;">${sanitizeHTML(inputParams.raw_prompt_text || 'N/A')}</pre></li>
                ${inputParams.template_id_used ? `<li><strong>Template Usado (ID):</strong> ${sanitizeHTML(inputParams.template_id_used)}</li>` : ''}
            `;
        if (inputParams.template_custom_values && Object.keys(inputParams.template_custom_values).length > 0) {
            html += '<li><strong>Valores dos Campos do Template:</strong><ul>';
            for (const key in inputParams.template_custom_values) {
                html += `<li><strong>${sanitizeHTML(key)}:</strong> ${sanitizeHTML(inputParams.template_custom_values[key])}</li>`;
            }
            html += '</ul></li>';
        }
        html += `</ul>`;

        html += `<h6>Parâmetros da Geração (Configurados):</h6><ul>`;
        const userGenSettings = inputParams.generation_settings_input || {};
        html += `<li><strong>Temperatura:</strong> ${sanitizeHTML(userGenSettings.temperature ?? (geminiParams.temperature ?? 'Padrão API'))}</li>`;
        html += `<li><strong>Max Tokens:</strong> ${sanitizeHTML(userGenSettings.maxOutputTokens ?? (geminiParams.maxOutputTokens ?? 'Padrão API'))}</li>`;
        // Adicionar outros parâmetros se existirem
        html += `</ul>`;

        // Tokens (se disponíveis)
        if(item.token_count_prompt || item.token_count_response) {
            html += `<h6>Contagem de Tokens:</h6><ul>`;
            if(item.token_count_prompt) html += `<li><strong>Tokens do Prompt:</strong> ${item.token_count_prompt}</li>`;
            if(item.token_count_response) html += `<li><strong>Tokens da Resposta:</strong> ${item.token_count_response}</li>`;
            html += `</ul>`;
        }

        html += `<p class="mt-3"><small class="text-muted">Gerado em: ${new Date(item.created_at).toLocaleString('pt-BR')}</small></p>`;
        historyItemModalBody.innerHTML = html;
    }

    if(copyHistoryInputBtn) {
        copyHistoryInputBtn.addEventListener('click', () => {
            const inputPre = historyItemModalBody.querySelectorAll('pre')[0];
            if (inputPre && inputPre.textContent) {
                navigator.clipboard.writeText(inputPre.textContent)
                    .then(() => showGlobalToast('success', 'Input copiado!'))
                    .catch(err => showGlobalAlert('error', 'Falha ao Copiar'));
            }
        });
    }
    if(copyHistoryOutputBtn) {
         copyHistoryOutputBtn.addEventListener('click', () => {
            const outputPre = historyItemModalBody.querySelectorAll('pre')[1];
            if (outputPre && outputPre.textContent) {
                navigator.clipboard.writeText(outputPre.textContent)
                    .then(() => showGlobalToast('success', 'Output copiado!'))
                    .catch(err => showGlobalAlert('error', 'Falha ao Copiar'));
            }
        });
    }


    // --- LÓGICA DO MODAL DE ASSISTÊNCIA IA ---
    if (aiActionTypeSelect) {
        aiActionTypeSelect.addEventListener('change', function() {
            const selectedAction = this.value;
            aiAssistantInputArea.classList.add('d-none');
            aiAssistantToneSelectorArea.classList.add('d-none');
            aiAssistantResultOutputDiv.innerHTML = '';
            applyAiAssistantResultBtn.classList.add('d-none');
            currentAiAssistantOutput = "";
            currentAiAssistantActionType = selectedAction;

            if (selectedAction === 'expand_idea') {
                aiAssistantInputArea.classList.remove('d-none');
                aiAssistantUserInputLabel.textContent = 'Sua ideia curta para expandir:';
                aiAssistantUserInput.value = '';
                aiAssistantUserInput.placeholder = 'Ex: Um poema sobre a lua para crianças';
            } else if (selectedAction === 'change_tone') {
                aiAssistantInputArea.classList.remove('d-none');
                aiAssistantUserInputLabel.textContent = 'Texto para alterar o tom (opcional, usa prompt principal se vazio):';
                aiAssistantUserInput.value = '';
                aiAssistantUserInput.placeholder = 'Cole o texto aqui ou deixe em branco para usar o prompt do dashboard.';
                aiAssistantToneSelectorArea.classList.remove('d-none');
            } else if (selectedAction) {
                // Para 'analyze_prompt', 'suggest_variations', 'simplify_prompt', não precisa de input extra no modal
            }
        });
    }

    if (runAiAssistantBtn) {
        runAiAssistantBtn.addEventListener('click', async function() {
            if (!currentAiAssistantActionType) {
                showGlobalToast('warning', 'Selecione um tipo de assistência primeiro.');
                return;
            }
            runAiAssistantBtnSpinner.classList.remove('d-none');
            runAiAssistantBtn.disabled = true;
            aiAssistantResultOutputDiv.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-info" role="status"></div><p class="mt-2 text-muted">Assistente IA processando...</p></div>';
            applyAiAssistantResultBtn.classList.add('d-none');

            let currentPromptForAssistant = promptMainTextTextarea.value; // Para textarea
            // if (ckEditorPromptInstance) currentPromptForAssistant = ckEditorPromptInstance.getData();

            const payload = {
                action_type: currentAiAssistantActionType,
                current_prompt_text: currentPromptForAssistant,
                user_input_idea: (currentAiAssistantActionType === 'expand_idea') ? aiAssistantUserInput.value : '',
                new_tone: (currentAiAssistantActionType === 'change_tone') ? aiAssistantNewToneSelect.value : '',
                suggestion_count: parseInt(aiSuggestionCountInput.value)
            };
            
            if (currentAiAssistantActionType === 'change_tone' && aiAssistantUserInput.value.trim() !== '') {
                payload.current_prompt_text = aiAssistantUserInput.value.trim(); // Usa o texto do modal se fornecido
            }


            try {
                const response = await axios.post('api/ai_assistant.php', payload);
                if (response.data.success && response.data.assisted_text) {
                    currentAiAssistantOutput = response.data.assisted_text;
                    // Formatar a saída se forem múltiplas variações
                    if (payload.action_type === 'suggest_variations' && currentAiAssistantOutput.includes('---VARIANT---')) {
                        const variations = currentAiAssistantOutput.split('---VARIANT---').map(v => v.trim()).filter(Boolean);
                        let variationsHtml = '<p>Selecione uma variação para aplicar:</p><div class="list-group">';
                        variations.forEach((variant, index) => {
                            variationsHtml += `
                                <label class="list-group-item">
                                    <input class="form-check-input me-1" type="radio" name="aiVariation" value="${index}">
                                    ${sanitizeHTML(variant).replace(/\n/g, '<br>')}
                                </label>`;
                        });
                        variationsHtml += '</div>';
                        aiAssistantResultOutputDiv.innerHTML = variationsHtml;
                    } else {
                        aiAssistantResultOutputDiv.innerHTML = sanitizeHTML(currentAiAssistantOutput).replace(/\n/g, '<br>');
                    }
                    applyAiAssistantResultBtn.classList.remove('d-none');
                } else {
                    aiAssistantResultOutputDiv.innerHTML = `<div class="alert alert-danger">${response.data.error || 'Erro desconhecido do assistente.'}</div>`;
                }
            } catch (error) {
                console.error("Erro na assistência IA:", error);
                let errorMsg = 'Falha na comunicação com o assistente IA.';
                if (error.response && error.response.data && error.response.data.error) {
                    errorMsg = error.response.data.error;
                }
                aiAssistantResultOutputDiv.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
            } finally {
                runAiAssistantBtnSpinner.classList.add('d-none');
                runAiAssistantBtn.disabled = false;
            }
        });
    }

    if (applyAiAssistantResultBtn) {
        applyAiAssistantResultBtn.addEventListener('click', function() {
            let textToApply = currentAiAssistantOutput;
            if (currentAiAssistantActionType === 'suggest_variations') {
                const selectedVariationRadio = aiAssistantResultOutputDiv.querySelector('input[name="aiVariation"]:checked');
                if (selectedVariationRadio) {
                    const variations = currentAiAssistantOutput.split('---VARIANT---').map(v => v.trim()).filter(Boolean);
                    textToApply = variations[parseInt(selectedVariationRadio.value)];
                } else {
                    showGlobalToast('warning', 'Por favor, selecione uma variação.');
                    return;
                }
            }

            if (textToApply) {
                // if (ckEditorPromptInstance) ckEditorPromptInstance.setData(textToApply); else 
                promptMainTextTextarea.value = textToApply;
                showGlobalToast('success', 'Resultado da assistência aplicado ao prompt!');
                aiAssistanceModal.hide();
            } else {
                showGlobalToast('info', 'Nenhum resultado para aplicar.');
            }
        });
    }
if (promptMainTextEditorContainer && typeof ClassicEditor !== 'undefined') {
    ClassicEditor
        .create(promptMainTextEditorContainer, {
            toolbar: {
                items: [
                    'undo', 'redo',
                    '|', 'heading',
                    '|', 'bold', 'italic', 
                    // 'underline', 'strikethrough', // Adicione se desejar
                    '|', 'link', 
                    '|', 'bulletedList', 'numberedList',
                    // '|', 'outdent', 'indent', // Adicione se desejar
                    // '|', 'blockQuote', // Adicione se desejar
                    // '|', 'insertTable', // Adicione se desejar
                ],
                shouldNotGroupWhenFull: true
            },
            language: 'pt-br', // Garanta que o pacote de idioma pt-br esteja disponível no CDN ou build
            placeholder: 'Descreva o que você quer que a IA gere. Use {{placeholders}} se estiver usando um template.',
            // Outras configurações: https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-EditorConfig.html
        })
        .then(editor => {
            ckEditorPromptInstance = editor;
            console.log('CKEditor para prompt principal inicializado.');

            // Sincronizar com o textarea oculto para validação e submissão fácil
            editor.model.document.on('change:data', () => {
                if (hiddenPromptTextarea) {
                    hiddenPromptTextarea.value = editor.getData();
                }
            });
            // Se houver valor inicial no textarea oculto (ex: vindo de um template carregado antes do editor)
            if (hiddenPromptTextarea && hiddenPromptTextarea.value.trim() !== '') {
                 editor.setData(hiddenPromptTextarea.value);
            }

        })
        .catch(error => {
            console.error('Erro ao inicializar CKEditor para prompt principal:', error);
            // Fallback: se o CKEditor falhar, talvez mostrar o textarea que está oculto (requer mais lógica)
            if(hiddenPromptTextarea) {
                // Poderia remover o container do CKEditor e mostrar o textarea
                // promptMainTextEditorContainer.style.display = 'none';
                // hiddenPromptTextarea.style.display = 'block';
                // hiddenPromptTextarea.rows = 8; // Restaurar atributos visuais
                // alert("O editor avançado não pôde ser carregado. Usando campo de texto simples.");
            }
        });
} else if (typeof ClassicEditor === 'undefined') {
    console.warn('CKEditor não está definido. Verifique se o script do CKEditor foi carregado.');
}
}); // Fim do DOMContentLoaded