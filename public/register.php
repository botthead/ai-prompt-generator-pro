<?php
$pageTitle = "Registrar Nova Conta"; // Define o título da página para o header.php
require_once __DIR__ . '/../src/Templates/header.php'; // Inclui o cabeçalho e inicia a sessão
require_once __DIR__ . '/../src/Core/Auth.php';      // Inclui a classe de autenticação

$auth = new Auth();

// Se o usuário já estiver logado, redireciona para o dashboard
if ($auth->isLoggedIn()) {
    header("Location: dashboard.php"); // dashboard.php na mesma pasta (public)
    exit;
}

$errorMessage = ''; // Para mensagens de erro específicas do formulário
$successMessage = ''; // Para mensagens de sucesso (menos comum aqui, mais no login)

// Gera um token CSRF para o formulário
$csrfToken = Auth::generateCsrfToken();

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Verifica o token CSRF
    if (!isset($_POST['csrf_token']) || !Auth::verifyCsrfToken($_POST['csrf_token'])) {
        $errorMessage = "Erro de validação CSRF. Por favor, tente novamente.";
    } else {
        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $confirm_password = $_POST['confirm_password'] ?? '';

        if (empty($name) || empty($email) || empty($password) || empty($confirm_password)) {
            $errorMessage = "Todos os campos são obrigatórios.";
        } elseif ($password !== $confirm_password) {
            $errorMessage = "As senhas não coincidem.";
        } elseif (strlen($password) < 6) {
            $errorMessage = "A senha deve ter pelo menos 6 caracteres.";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errorMessage = "Formato de email inválido.";
        } else {
            $result = $auth->register($name, $email, $password);
            if ($result === true) {
                $_SESSION['success_message'] = "Registro realizado com sucesso! Faça login para continuar.";
                header("Location: login.php"); // Redireciona para login após registro bem-sucedido
                exit;
            } else {
                $errorMessage = $result; // $result conterá a mensagem de erro do método register()
            }
        }
    }
     // Regenera o token CSRF após uma tentativa de POST para o próximo envio (se não for single-use)
     // Se for single-use, o verifyCsrfToken já teria unsetado.
     // Para formulários que podem ter erros e precisam ser reenviados, é melhor não unsetar no verify
     // e sim gerar um novo aqui ou deixar o mesmo. Para simplicidade, vamos manter o mesmo até o sucesso.
     // Se a filosofia é token por request, então sempre gerar um novo:
     // $csrfToken = Auth::generateCsrfToken(); // Se não estiver usando single-use, esta linha não é estritamente necessária aqui
}
?>

<div class="row justify-content-center mt-5">
    <div class="col-md-6 col-lg-5">
        <div class="card shadow-lg">
            <div class="card-header text-center bg-primary text-white">
                <h3 class="mb-0">Criar Conta</h3>
            </div>
            <div class="card-body p-4">
                <?php if ($errorMessage): ?>
                    <div class="alert alert-danger"><?php echo htmlspecialchars($errorMessage); ?></div>
                <?php endif; ?>
                
                <form action="register.php" method="POST" id="registerForm" novalidate>
                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrfToken); ?>">
                    
                    <div class="mb-3">
                        <label for="name" class="form-label">Nome Completo<span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="name" name="name" value="<?php echo htmlspecialchars($_POST['name'] ?? ''); ?>" required>
                        <div class="invalid-feedback">Por favor, insira seu nome.</div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="email" class="form-label">Email<span class="text-danger">*</span></label>
                        <input type="email" class="form-control" id="email" name="email" value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>" required>
                        <div class="invalid-feedback">Por favor, insira um email válido.</div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="password" class="form-label">Senha<span class="text-danger">*</span></label>
                        <input type="password" class="form-control" id="password" name="password" required minlength="6">
                        <div class="invalid-feedback">A senha deve ter no mínimo 6 caracteres.</div>
                        <small class="form-text text-muted">Mínimo de 6 caracteres.</small>
                    </div>
                    
                    <div class="mb-3">
                        <label for="confirm_password" class="form-label">Confirmar Senha<span class="text-danger">*</span></label>
                        <input type="password" class="form-control" id="confirm_password" name="confirm_password" required minlength="6">
                        <div class="invalid-feedback" id="confirmPasswordFeedback">As senhas devem coincidir.</div>
                    </div>
                    
                    <div class="d-grid">
                        <button type="submit" class="btn btn-primary btn-lg">Registrar</button>
                    </div>
                </form>
            </div>
            <div class="card-footer text-center py-3">
                <small>Já tem uma conta? <a href="login.php">Faça login aqui</a></small>
            </div>
        </div>
    </div>
</div>

<?php
// Adicionar o script auth.js ao array $pageScripts para ser incluído pelo footer.php
$pageScripts = ['auth.js'];
require_once __DIR__ . '/../src/Templates/footer.php';
?>