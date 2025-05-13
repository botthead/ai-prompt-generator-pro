// public/assets/js/templates-manager.js

document.addEventListener('DOMContentLoaded', function () {
    const templateFormModalElement = document.getElementById('templateFormModal');
    const templateFormModal = new bootstrap.Modal(templateFormModalElement);
    const templateForm = document.getElementById('templateForm');
    const templateFormModalLabel = document.getElementById('templateFormModalLabel');
    const templateIdInput = document.getElementById('template_id');
    const templateNameInput = document.getElementById('template_name');
    const templateDescriptionTextarea = document.getElementById('template_description');
    const templateStructureTextarea = document.getElementById('template_structure');
    const customFieldsDefinitionContainer = document.getElementById('customFieldsDefinitionContainer');
    const addCustomFieldBtn = document.getElementById('addCustomFieldBtn');
    const saveTemplateBtn = document.getElementById('saveTemplateBtn');
    const saveTemplateBtnSpinner = saveTemplateBtn.querySelector('.spinner-border');
    const templatesListContainer = document.getElementById('templatesListContainer');
    const openCreateTemplateModalBtn = document.getElementById('openCreateTemplateModalBtn');
    const csrfTokenInput = templateForm.querySelector('input[name="csrf_token_template_form"]');


    // --- ABRIR MODAL PARA CRIAR ---
    if (openCreateTemplateModalBtn) {
        openCreateTemplateModalBtn.addEventListener('click', function () {
            templateForm.reset();
            templateIdInput.value = ''; // Garante que está criando, não editando
            templateFormModalLabel.textContent = 'Criar Novo Template';
            saveTemplateBtn.innerHTML = '<i class="fas fa-save me-1"></i>Salvar Template'; // Reset button text
            customFieldsDefinitionContainer.innerHTML = ''; // Limpa campos customizados
            // Adicionar um campo customizado vazio por padrão, se desejado
            // addCustomFieldRow(); 
            templateFormModal.show();
        });
    }

    // --- ADICIONAR LINHA DE CAMPO PERSONALIZADO ---
    let customFieldIndex = 0;
    function addCustomFieldRow(fieldData = null) {
        customFieldIndex++;
        const fieldIdPrefix = `cf_${customFieldIndex}_`;

        const row = document.createElement('div');
        row.className = 'row custom-field-row mb-3 p-2 border rounded';
        row.innerHTML = `
            <div class="col-md-3 mb-2">
                <label for="${fieldIdPrefix}name" class="form-label form-label-sm">Nome Placeholder<span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="${fieldIdPrefix}name" name="custom_field_name[]" placeholder="Ex: assunto_principal" value="${fieldData?.name || ''}" required>
                <small class="form-text text-muted">Sem {{}}.</small>
            </div>
            <div class="col-md-3 mb-2">
                <label for="${fieldIdPrefix}label" class="form-label form-label-sm">Rótulo no Formulário<span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="${fieldIdPrefix}label" name="custom_field_label[]" placeholder="Ex: Assunto Principal" value="${fieldData?.label || ''}" required>
            </div>
            <div class="col-md-2 mb-2">
                <label for="${fieldIdPrefix}type" class="form-label form-label-sm">Tipo<span class="text-danger">*</span></label>
                <select class="form-select form-select-sm custom-field-type-select" id="${fieldIdPrefix}type" name="custom_field_type[]" required>
                    <option value="text" ${fieldData?.type === 'text' ? 'selected' : ''}>Texto Curto</option>
                    <option value="textarea" ${fieldData?.type === 'textarea' ? 'selected' : ''}>Texto Longo</option>
                    <option value="number" ${fieldData?.type === 'number' ? 'selected' : ''}>Número</option>
                    <option value="select" ${fieldData?.type === 'select' ? 'selected' : ''}>Seleção (Dropdown)</option>
                </select>
            </div>
            <div class="col-md-3 mb-2">
                <label for="${fieldIdPrefix}placeholder" class="form-label form-label-sm">Placeholder/Padrão</label>
                <input type="text" class="form-control form-control-sm" id="${fieldIdPrefix}placeholder" name="custom_field_placeholder[]" value="${fieldData?.placeholder || ''}">
            </div>
            <div class="col-md-1 d-flex align-items-end mb-2">
                <button type="button" class="btn btn-sm btn-outline-danger remove-custom-field-btn w-100" title="Remover Campo"><i class="fas fa-trash-alt"></i></button>
            </div>
            <div class="col-12 mb-2 form-check ms-2">
                <input type="checkbox" class="form-check-input" id="${fieldIdPrefix}required" name="custom_field_required[${customFieldIndex-1}]" value="1" ${fieldData?.required ? 'checked' : ''}>
                <label class="form-check-label" for="${fieldIdPrefix}required">Obrigatório?</label>
            </div>
            <div class="col-12 custom-field-options-container ${fieldData?.type === 'select' ? '' : 'd-none'}">
                 <label for="${fieldIdPrefix}options" class="form-label form-label-sm">Opções (uma por linha)</label>
                 <textarea class="form-control form-control-sm" id="${fieldIdPrefix}options" name="custom_field_options[]" rows="3" placeholder="Opção 1\nOpção 2">${fieldData?.options?.join('\n') || ''}</textarea>
            </div>
        `;
        customFieldsDefinitionContainer.appendChild(row);
    }

    if (addCustomFieldBtn) {
        addCustomFieldBtn.addEventListener('click', function () {
            addCustomFieldRow();
        });
    }

    // Remover linha de campo personalizado e mostrar/ocultar opções do select
    customFieldsDefinitionContainer.addEventListener('click', function (event) {
        if (event.target.closest('.remove-custom-field-btn')) {
            event.target.closest('.custom-field-row').remove();
        }
    });
    customFieldsDefinitionContainer.addEventListener('change', function(event){
        if (event.target.classList.contains('custom-field-type-select')) {
            const optionsContainer = event.target.closest('.custom-field-row').querySelector('.custom-field-options-container');
            if (event.target.value === 'select') {
                optionsContainer.classList.remove('d-none');
            } else {
                optionsContainer.classList.add('d-none');
                optionsContainer.querySelector('textarea').value = ''; // Limpa opções se mudar tipo
            }
        }
    });


    // --- SALVAR/ATUALIZAR TEMPLATE ---
    if (templateForm) {
        templateForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            saveTemplateBtnSpinner.classList.remove('d-none');
            saveTemplateBtn.disabled = true;

            // Coleta dos campos customizados precisa ser manual por causa dos nomes com `[]`
            const formData = new FormData(templateForm); 
            // FormData já pega os campos com [] corretamente como arrays.

            try {
                const response = await axios.post('api/save_template.php', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' } // Necessário para FormData
                });

                if (response.data.success) {
                    showGlobalToast('success', templateIdInput.value ? 'Template atualizado com sucesso!' : 'Template criado com sucesso!');
                    templateFormModal.hide();
                    // Atualizar a lista de templates na página (idealmente sem recarregar tudo)
                    fetchAndRenderTemplates();
                } else {
                    showGlobalAlert('error', 'Erro ao Salvar', response.data.error || 'Não foi possível salvar o template.');
                }
            } catch (error) {
                console.error('Erro ao salvar template:', error);
                let errorMsg = 'Falha de comunicação ao salvar o template.';
                if (error.response && error.response.data && error.response.data.error) {
                    errorMsg = error.response.data.error;
                }
                showGlobalAlert('error', 'Erro na Requisição', errorMsg);
            } finally {
                saveTemplateBtnSpinner.classList.add('d-none');
                saveTemplateBtn.disabled = false;
            }
        });
    }

    // --- CARREGAR E RENDERIZAR TEMPLATES NA PÁGINA ---
    async function fetchAndRenderTemplates() {
        if (!templatesListContainer && !document.getElementById('openCreateTemplateModalBtn')) return; // Só executa se estiver na página de templates

        showGlobalLoader(true);
        try {
            const response = await axios.get('api/get_user_templates.php');
            if (response.data.success && response.data.templates) {
                renderTemplatesList(response.data.templates);
            } else {
                templatesListContainer.innerHTML = '<div class="col-12"><div class="alert alert-warning">Não foi possível carregar seus templates.</div></div>';
            }
        } catch (error) {
            console.error("Erro ao buscar templates:", error);
            templatesListContainer.innerHTML = '<div class="col-12"><div class="alert alert-danger">Falha na comunicação ao buscar templates.</div></div>';
        } finally {
            showGlobalLoader(false);
        }
    }

    function renderTemplatesList(templates) {
        if (!templatesListContainer) return;
        templatesListContainer.innerHTML = ''; // Limpa a lista atual
        if (templates.length === 0) {
            templatesListContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info text-center">
                        <i class="fas fa-info-circle fa-2x mb-3"></i><br>
                        Você ainda não criou nenhum template.<br>
                        Templates ajudam a agilizar a criação de prompts repetitivos ou complexos. Clique em "Criar Novo Template" para começar!
                    </div>
                </div>`;
            return;
        }
        templates.forEach(template => {
            const col = document.createElement('div');
            col.className = `col template-item-${template.id}`;
            col.innerHTML = `
                <div class="card h-100 shadow-sm template-card">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${sanitizeHTML(template.name)}</h5>
                        <p class="card-text text-muted small flex-grow-1">
                            ${sanitizeHTML(template.description ? (template.description.substring(0, 150) + (template.description.length > 150 ? '...' : '')) : 'Sem descrição.')}
                        </p>
                        <div class="mt-auto pt-2 border-top">
                            <button class="btn btn-sm btn-primary use-template-btn" data-template-id="${template.id}" title="Usar este template no Dashboard">
                                <i class="fas fa-rocket"></i> Usar
                            </button>
                            <button class="btn btn-sm btn-outline-secondary edit-template-btn ms-1" data-template-id="${template.id}" title="Editar Template">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-template-btn ms-1" data-template-id="${template.id}" title="Excluir Template">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            templatesListContainer.appendChild(col);
        });
    }
    // Carregar templates ao entrar na página (apenas se o container existir)
    if (templatesListContainer) {
        fetchAndRenderTemplates();
    }

    // --- DELEGAÇÃO DE EVENTOS PARA A LISTA DE TEMPLATES (EDITAR, EXCLUIR, USAR) ---
    if (templatesListContainer) {
        templatesListContainer.addEventListener('click', async function (event) {
            const editButton = event.target.closest('.edit-template-btn');
            const deleteButton = event.target.closest('.delete-template-btn');
            const useButton = event.target.closest('.use-template-btn');

            if (editButton) {
                const templateId = editButton.dataset.templateId;
                showGlobalLoader(true);
                try {
                    const response = await axios.get(`api/get_template_details.php?id=${templateId}`);
                    if (response.data.success && response.data.template) {
                        const tpl = response.data.template;
                        templateForm.reset();
                        templateIdInput.value = tpl.id;
                        templateNameInput.value = tpl.name;
                        templateDescriptionTextarea.value = tpl.description || '';
                        templateStructureTextarea.value = tpl.prompt_structure;
                        
                        customFieldsDefinitionContainer.innerHTML = ''; // Limpa campos anteriores
                        customFieldIndex = 0; // Reseta o índice para novos campos
                        if (tpl.custom_fields_decoded && Array.isArray(tpl.custom_fields_decoded)) {
                            tpl.custom_fields_decoded.forEach(field => addCustomFieldRow(field));
                        }

                        templateFormModalLabel.textContent = 'Editar Template';
                        saveTemplateBtn.innerHTML = '<i class="fas fa-save me-1"></i>Atualizar Template';
                        templateFormModal.show();
                    } else {
                        showGlobalAlert('error', 'Erro ao Carregar', response.data.error || 'Não foi possível carregar o template para edição.');
                    }
                } catch (error) {
                    console.error("Erro ao carregar template para edição:", error);
                    showGlobalAlert('error', 'Erro na Requisição', 'Falha de comunicação ao carregar template.');
                } finally {
                    showGlobalLoader(false);
                }
            }

            if (deleteButton) {
                const templateId = deleteButton.dataset.templateId;
                const templateName = deleteButton.closest('.card-body').querySelector('.card-title').textContent;
                Swal.fire({
                    title: 'Confirmar Exclusão',
                    html: `Tem certeza que deseja excluir o template "<strong>${sanitizeHTML(templateName)}</strong>"? Esta ação não pode ser desfeita.`,
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
                            // Para POST com axios e corpo JSON, o token CSRF precisa estar no corpo.
                            // O PHP espera 'csrf_token_template_form' para save, mas para delete pode ser genérico.
                            const csrfVal = csrfTokenInput ? csrfTokenInput.value : ''; // Pega o token da página
                            const response = await axios.post('api/delete_template.php', { id: templateId, csrf_token: csrfVal });
                            if (response.data.success) {
                                showGlobalToast('success', 'Template excluído com sucesso!');
                                // Remover o card do template da UI
                                const itemToRemove = templatesListContainer.querySelector(`.template-item-${templateId}`);
                                if(itemToRemove) itemToRemove.remove();
                                if (templatesListContainer.childElementCount === 0) {
                                     fetchAndRenderTemplates(); // Recarrega para mostrar mensagem de "nenhum template"
                                }
                            } else {
                                showGlobalAlert('error', 'Erro ao Excluir', response.data.error || 'Não foi possível excluir o template.');
                            }
                        } catch (error) {
                            console.error("Erro ao excluir template:", error);
                            showGlobalAlert('error', 'Erro na Requisição', 'Falha de comunicação ao excluir.');
                        } finally {
                            showGlobalLoader(false);
                        }
                    }
                });
            }
            
            if (useButton) {
                const templateId = useButton.dataset.templateId;
                // Armazenar no localStorage para o dashboard pegar ao carregar, ou passar via query param.
                localStorage.setItem('selectedTemplateIdToUse', templateId);
                window.location.href = 'dashboard.php'; // Redireciona para o dashboard
            }
        });
    }

    // Limpar modal ao fechar
    templateFormModalElement.addEventListener('hidden.bs.modal', function () {
        templateForm.reset();
        templateIdInput.value = '';
        customFieldsDefinitionContainer.innerHTML = '';
        templateFormModalLabel.textContent = 'Criar Novo Template';
        saveTemplateBtn.innerHTML = '<i class="fas fa-save me-1"></i>Salvar Template';
        // Limpar classes de validação se houver
        templateForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    });

    // Verifica se há um template selecionado para usar ao carregar o dashboard (vindo de templates.php)
    // Esta lógica deve estar no dashboard-main.js, mas é relacionada
    if (window.location.pathname.endsWith('dashboard.php')) {
        const selectedTemplateId = localStorage.getItem('selectedTemplateIdToUse');
        if (selectedTemplateId) {
            const promptTemplateSelect = document.getElementById('promptTemplate');
            if (promptTemplateSelect) {
                promptTemplateSelect.value = selectedTemplateId;
                // Disparar o evento 'change' para carregar os detalhes do template
                const event = new Event('change', { bubbles: true });
                promptTemplateSelect.dispatchEvent(event);
            }
            localStorage.removeItem('selectedTemplateIdToUse'); // Limpa após o uso
        }
    }


}); // Fim do DOMContentLoaded