<?php
$pageTitle = "Meu Perfil e Configurações";
require_once __DIR__ . '/../src/Templates/header.php';
require_once __DIR__ . '/../src/Core/Auth.php';
require_once __DIR__ . '/../src/Core/User.php';

$auth = new Auth();
$auth->requireLogin(); // Garante que o usuário esteja logado

$user = new User();
$userId = $auth->getUserId();
$userData = $user->getById($userId); // Pega os dados atuais do usuário

$decryptedApiKey = '';
if (!empty($userData['api_key_encrypted'])) {
    $decryptedApiKey = Auth::decryptApiKey($userData['api_key_encrypted']);
    if ($decryptedApiKey === null && !empty($userData['api_key_encrypted'])) {
        // Chave está no banco, mas falhou ao descriptografar (pode ser chave de criptografia errada ou corrompida)
        $_SESSION['error_message'] = "Atenção: Não foi possível acessar sua chave API Gemini. Pode ser necessário reconfigurá-la.";
    }
}

$profileMessage = ''; $passwordMessage = ''; $apiKeyMessage = '';
$csrfToken = Auth::generateCsrfToken();

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (!isset($_POST['csrf_token']) || !Auth::verifyCsrfToken($_POST['csrf_token'])) {
        // Usar $_SESSION['error_message'] e redirecionar para evitar reenvio do formulário em refresh
        $_SESSION['error_message'] = "Erro de validação CSRF. Ação não processada.";
        header("Location: profile.php");
        exit;
    }

    if (isset($_POST['update_profile'])) {
        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $result = $user->updateProfile($userId, $name, $email);
        if ($result === true) {
            $_SESSION['success_message'] = "Perfil atualizado com sucesso!";
        } else {
            $_SESSION['error_message'] = $result; // Mensagem de erro do método
        }
        header("Location: profile.php"); exit;

    } elseif (isset($_POST['update_password'])) {
        $current_password = $_POST['current_password'] ?? '';
        $new_password = $_POST['new_password'] ?? '';
        $confirm_new_password = $_POST['confirm_new_password'] ?? '';

        if (empty($current_password) || empty($new_password) || empty($confirm_new_password)) {
             $_SESSION['error_message'] = "Todos os campos de senha são obrigatórios.";
        } elseif ($new_password !== $confirm_new_password) {
            $_SESSION['error_message'] = "As novas senhas não coincidem.";
        } elseif (strlen($new_password) < 6) {
             $_SESSION['error_message'] = "A nova senha deve ter pelo menos 6 caracteres.";
        } else {
            $result = $user->updatePassword($userId, $current_password, $new_password);
            if ($result === true) {
                $_SESSION['success_message'] = "Senha atualizada com sucesso!";
            } else {
                $_SESSION['error_message'] = $result;
            }
        }
        header("Location: profile.php"); exit;

    } elseif (isset($_POST['update_api_key'])) {
        $api_key_input = trim($_POST['api_key'] ?? ''); // Pode ser string vazia para remover a chave
        $result = $user->updateApiKey($userId, $api_key_input);
        if ($result === true) {
            $_SESSION['success_message'] = !empty($api_key_input) ? "Chave de API Gemini salva com sucesso!" : "Chave de API Gemini removida.";
        } else {
             $_SESSION['error_message'] = is_string($result) ? $result : "Erro ao atualizar a chave de API.";
        }
        header("Location: profile.php"); exit;
    }
    // $csrfToken = Auth::generateCsrfToken(); // Se não for single-use
}
?>

<h1 class="mb-4">Meu Perfil e Configurações</h1>

<div class="row">
    <!-- Coluna para Informações Pessoais e Chave API -->
    <div class="col-lg-7 col-md-12 mb-4">
        <div class="card mb-4 shadow-sm">
            <div class="card-header">
                <h4><i class="fas fa-id-card me-2"></i>Informações Pessoais</h4>
            </div>
            <div class="card-body">
                <form method="POST" action="profile.php" id="profileUpdateForm">
                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrfToken); ?>">
                    <div class="mb-3">
                        <label for="name" class="form-label">Nome Completo</label>
                        <input type="text" class="form-control" id="name" name="name" value="<?php echo htmlspecialchars($userData['name']); ?>" required>
                    </div>
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" class="form-control" id="email" name="email" value="<?php echo htmlspecialchars($userData['email']); ?>" required>
                    </div>
                    <button type="submit" name="update_profile" class="btn btn-primary"><i class="fas fa-save me-2"></i>Salvar Informações</button>
                </form>
            </div>
        </div>

        <div class="card shadow-sm">
            <div class="card-header">
                <h4><i class="fas fa-key me-2"></i>Chave da API Gemini</h4>
            </div>
            <div class="card-body">
                <form method="POST" action="profile.php" id="apiKeyForm">
                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrfToken); ?>">
                    <div class="mb-3">
                        <label for="api_key" class="form-label">Sua Chave (Google AI Studio)</label>
                        <div class="input-group">
                            <input type="password" class="form-control" id="api_key" name="api_key" placeholder="Cole sua chave aqui para salvar ou atualizar" value="<?php echo htmlspecialchars($decryptedApiKey ?? ''); ?>">
                            <button class="btn btn-outline-secondary" type="button" id="toggleApiKeyVisibility"><i class="fas fa-eye"></i></button>
                        </div>
                        <small class="form-text text-muted">
                            Sua chave é armazenada de forma criptografada. Se o campo estiver preenchido, é sua chave atual.
                            Para remover, apague o conteúdo e salve.
                            Obtenha sua chave em <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio <i class="fas fa-external-link-alt fa-xs"></i></a>.
                        </small>
                    </div>
                    <button type="submit" name="update_api_key" class="btn btn-success"><i class="fas fa-check-circle me-2"></i>Salvar Chave API</button>
                </form>
            </div>
        </div>
    </div>

    <!-- Coluna para Alterar Senha -->
    <div class="col-lg-5 col-md-12 mb-4">
        <div class="card shadow-sm">
            <div class="card-header">
                <h4><i class="fas fa-lock me-2"></i>Alterar Senha</h4>
            </div>
            <div class="card-body">
                <form method="POST" action="profile.php" id="changePasswordForm">
                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrfToken); ?>">
                    <div class="mb-3">
                        <label for="current_password" class="form-label">Senha Atual</label>
                        <input type="password" class="form-control" id="current_password" name="current_password" required autocomplete="current-password">
                    </div>
                    <div class="mb-3">
                        <label for="new_password" class="form-label">Nova Senha</label>
                        <input type="password" class="form-control" id="new_password" name="new_password" required minlength="6" autocomplete="new-password">
                        <small class="form-text text-muted">Mínimo de 6 caracteres.</small>
                    </div>
                    <div class="mb-3">
                        <label for="confirm_new_password" class="form-label">Confirmar Nova Senha</label>
                        <input type="password" class="form-control" id="confirm_new_password" name="confirm_new_password" required minlength="6" autocomplete="new-password">
                    </div>
                    <button type="submit" name="update_password" class="btn btn-warning"><i class="fas fa-key me-2"></i>Alterar Senha</button>
                </form>
            </div>
        </div>
    </div>
</div>

<?php
$pageScripts = ['auth.js']; // Inclui o auth.js para a funcionalidade de mostrar/ocultar API key e validação de senha
require_once __DIR__ . '/../src/Templates/footer.php';
?> 
