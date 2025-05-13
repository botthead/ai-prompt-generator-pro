// public/assets/js/auth.js

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            const password = registerForm.querySelector('#password');
            const confirmPassword = registerForm.querySelector('#confirm_password');
            
            // Limpar mensagens de erro anteriores do JS
            const existingError = registerForm.querySelector('.password-mismatch-error-js');
            if(existingError) existingError.remove();
            if(confirmPassword) confirmPassword.classList.remove('is-invalid');


            if (password && confirmPassword && password.value !== confirmPassword.value) {
                event.preventDefault(); 
                showGlobalToast('error', 'As senhas não coincidem!'); 
                
                if(confirmPassword){
                    confirmPassword.classList.add('is-invalid');
                    // Adicionar a mensagem de feedback do Bootstrap para acessibilidade, mesmo com o toast
                    const feedbackDiv = document.createElement('div');
                    feedbackDiv.className = 'invalid-feedback password-mismatch-error-js d-block'; // d-block para forçar exibição
                    feedbackDiv.textContent = 'As senhas não coincidem.';
                    confirmPassword.parentNode.insertBefore(feedbackDiv, confirmPassword.nextSibling);
                    confirmPassword.focus();
                }
                return false;
            }
        });
    }

    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(event) {
            const newPassword = changePasswordForm.querySelector('#new_password');
            const confirmNewPassword = changePasswordForm.querySelector('#confirm_new_password');

            const existingError = changePasswordForm.querySelector('.new-password-mismatch-error-js');
            if(existingError) existingError.remove();
            if(confirmNewPassword) confirmNewPassword.classList.remove('is-invalid');

            if (newPassword && confirmNewPassword && newPassword.value !== confirmNewPassword.value) {
                event.preventDefault();
                showGlobalToast('error', 'As novas senhas não coincidem!');
                
                if(confirmNewPassword){
                    confirmNewPassword.classList.add('is-invalid');
                    const feedbackDiv = document.createElement('div');
                    feedbackDiv.className = 'invalid-feedback new-password-mismatch-error-js d-block';
                    feedbackDiv.textContent = 'As novas senhas não coincidem.';
                    confirmNewPassword.parentNode.insertBefore(feedbackDiv, confirmNewPassword.nextSibling);
                    confirmNewPassword.focus();
                }
                return false;
            }
        });
    }

    const toggleApiKeyBtn = document.getElementById('toggleApiKeyVisibility');
    const apiKeyInput = document.getElementById('api_key'); 

    if (toggleApiKeyBtn && apiKeyInput) {
        toggleApiKeyBtn.addEventListener('click', function() {
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                this.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar';
            } else {
                apiKeyInput.type = 'password';
                this.innerHTML = '<i class="fas fa-eye"></i> Mostrar';
            }
        });
    }
});