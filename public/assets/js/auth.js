// auth.js - Scripts para páginas de autenticação (login, registro, perfil)

document.addEventListener('DOMContentLoaded', function() {
    // Exemplo de validação de formulário de registro (pode ser mais robusto)
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            const password = registerForm.querySelector('#password');
            const confirmPassword = registerForm.querySelector('#confirm_password');
            
            if (password && confirmPassword && password.value !== confirmPassword.value) {
                event.preventDefault(); // Impede o envio do formulário
                // Remover mensagens de erro anteriores
                const existingError = registerForm.querySelector('.password-mismatch-error');
                if(existingError) existingError.remove();

                // Adicionar mensagem de erro
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger mt-2 password-mismatch-error';
                errorDiv.textContent = 'As senhas não coincidem!';
                confirmPassword.parentNode.insertBefore(errorDiv, confirmPassword.nextSibling);
                confirmPassword.classList.add('is-invalid');
                confirmPassword.focus();
                // showGlobalToast('error', 'As senhas não coincidem!'); // Usando SweetAlert Toast
                return false;
            }
            // Outras validações (força da senha, etc.) podem ser adicionadas aqui
        });
    }

    // Exemplo de validação de formulário de alteração de senha
    const changePasswordForm = document.getElementById('changePasswordForm'); // Supondo que o form de senha no profile.php tenha este ID
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(event) {
            const newPassword = changePasswordForm.querySelector('#new_password');
            const confirmNewPassword = changePasswordForm.querySelector('#confirm_new_password');

            if (newPassword && confirmNewPassword && newPassword.value !== confirmNewPassword.value) {
                event.preventDefault();
                const existingError = changePasswordForm.querySelector('.new-password-mismatch-error');
                if(existingError) existingError.remove();
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger mt-2 new-password-mismatch-error';
                errorDiv.textContent = 'As novas senhas não coincidem!';
                confirmNewPassword.parentNode.insertBefore(errorDiv, confirmNewPassword.nextSibling);
                confirmNewPassword.classList.add('is-invalid');
                confirmNewPassword.focus();
                return false;
            }
        });
    }


    // Mostrar/Ocultar API Key no perfil
    const toggleApiKeyBtn = document.getElementById('toggleApiKeyVisibility');
    const apiKeyInput = document.getElementById('api_key'); // Supondo que o input da API Key tenha este ID

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
