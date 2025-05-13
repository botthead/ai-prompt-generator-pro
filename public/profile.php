<?php
$pageTitle = "Meu Perfil e Configurações";
require_once __DIR__ . '/../src/Templates/header.php';
require_once __DIR__ . '/../src/Core/Auth.php';
require_once __DIR__ . '/../src/Core/User.php';

$auth = new Auth();
$auth->requireLogin(); 

$user = new User();
$userId = $auth->getUserId();
$userData = $user->getById($userId); 

$decryptedApiKey = '';
if (!empty($userData['api_key_encrypted'])) {
    $decryptedApiKey = Auth::decryptApiKey($userData['api_key_encrypted']);
    if ($decryptedApiKey === null && !empty($userData['api_key_encrypted'])) {
        $_SESSION['error_message'] = "Atenção: Não foi possível acessar sua chave API Gemini. Pode ser necessário reconfigurá-la.";
    }
}

$csrfToken = Auth::generateCsrfToken();

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // ... (lógica POST existente para perfil, senha, api key) ...
    // Mantém a lógica de redirecionamento com header("Location: profile.php"); exit; após cada ação.
    if (!isset($_POST['csrf_token']) || !Auth::verifyCsrfToken($_POST['csrf_token'])) {
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
            $_SESSION['error_message'] = $result;
        }
        header("Location: profile.php"); exit;

    } elseif (isset($_POST['update_password'])) {
        // ... (lógica existente) ...
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
        $api_key_input = trim($_POST['api_key'] ?? '');
        $result = $user->updateApiKey($userId, $api_key_input);
        if ($result === true) {
            $_SESSION['success_message'] = !empty($api_key_input) ? "Chave de API Gemini salva!" : "Chave de API Gemini removida.";
        } else {
             $_SESSION['error_message'] = is_string($result) ? $result : "Erro ao atualizar a chave de API.";
        }
        header("Location: profile.php"); exit;
    }
}
?>

<h1 class="mb-4">Meu Perfil e Configurações</h1>

<div class="row">
    <div class="col-lg-7 col-md-12 mb-4">
        <!-- ... (Card de Informações Pessoais - sem alteração) ... -->
         <div class="card mb-4 shadow-sm">
            <div class="card-header"><h4><i class="fas fa-id-card me-2"></i>Informações Pessoais</h4></div>
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

        <!-- ... (Card de Chave API - sem alteração significativa, exceto talvez ID do form se auth.js precisar) ... -->
        <div class="card shadow-sm  mb-4">
            <div class="card-header"><h4><i class="fas fa-key me-2"></i>Chave da API Gemini</h4></div>
            <div class="card-body">
                <form method="POST" action="profile.php" id="apiKeyForm">
                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrfToken); ?>">
                    <div class="mb-3">
                        <label for="api_key" class="form-label">Sua Chave (Google AI Studio)</label>
                        <div class="input-group">
                            <input type="password" class="form-control" id="api_key" name="api_key" placeholder="Cole sua chave aqui para salvar ou atualizar" value="<?php echo htmlspecialchars($decryptedApiKey ?? ''); ?>">
                            <button class="btn btn-outline-secondary" type="button" id="toggleApiKeyVisibility" title="Mostrar/Ocultar Chave"><i class="fas fa-eye"></i></button>
                        </div>
                        <small class="form-text text-muted">...</small>
                    </div>
                    <button type="submit" name="update_api_key" class="btn btn-success"><i class="fas fa-check-circle me-2"></i>Salvar Chave API</button>
                </form>
            </div>
        </div>
        
        <!-- NOVA SEÇÃO DE EXPORTAÇÃO -->
        <div class="card mt-4 shadow-sm">
            <div class="card-header">
                <h4><i class="fas fa-download me-2"></i>Exportar Meus Dados</h4>
            </div>
            <div class="card-body">
                <p>Faça o download dos seus dados armazenados na plataforma.</p>
                <h6 class="mt-3">Histórico Completo de Prompts:</h6>
                <a href="api/export_data.php?type=history_all&format=json" class="btn btn-sm btn-outline-primary mb-2" download>
                    <i class="fas fa-file-code me-1"></i> Exportar Histórico (JSON)
                </a>
                <a href="api/export_data.php?type=history_all&format=txt" class="btn btn-sm btn-outline-secondary mb-2" download>
                    <i class="fas fa-file-alt me-1"></i> Exportar Histórico (TXT)
                </a>
                <hr>
                <p><small class="text-muted">A exportação de templates individuais pode ser feita na página <a href="templates.php">Meus Templates</a>.</small></p>
            </div>
        </div>

    </div>

    <div class="col-lg-5 col-md-12 mb-4">
        <!-- ... (Card de Alterar Senha - ID do form `changePasswordForm` para auth.js) ... -->
        <div class="card shadow-sm">
            <div class="card-header"><h4><i class="fas fa-lock me-2"></i>Alterar Senha</h4></div>
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
$pageScripts = ['auth.js']; 
require_once __DIR__ . '/../src/Templates/footer.php';
?>