<?php
$pageTitle = "Login";
require_once __DIR__ . '/../src/Templates/header.php'; // Header já inicia a sessão
require_once __DIR__ . '/../src/Core/Auth.php';

$auth = new Auth();

if ($auth->isLoggedIn()) {
    header("Location: dashboard.php");
    exit;
}

$errorMessage = '';
// Mensagens flash já são tratadas no header.php

$csrfToken = Auth::generateCsrfToken();

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (!isset($_POST['csrf_token']) || !Auth::verifyCsrfToken($_POST['csrf_token'])) {
        $errorMessage = "Erro de validação CSRF. Por favor, tente novamente.";
    } else {
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (empty($email) || empty($password)) {
            $errorMessage = "Email e senha são obrigatórios.";
        } else {
            $result = $auth->login($email, $password);
            if ($result === true) {
                // Opcional: redirecionar para uma página específica após login ou deixar ir para dashboard.php
                // if (isset($_SESSION['redirect_url'])) {
                //    $redirect_url = $_SESSION['redirect_url'];
                //    unset($_SESSION['redirect_url']);
                //    header("Location: " . $redirect_url);
                // } else {
                header("Location: dashboard.php");
                // }
                exit;
            } else {
                $errorMessage = $result; // Mensagem de erro do método login()
            }
        }
    }
    // $csrfToken = Auth::generateCsrfToken(); // Se não for single-use
}
?>

<div class="row justify-content-center mt-5">
    <div class="col-md-5 col-lg-4">
        <div class="card shadow-lg">
            <div class="card-header text-center bg-primary text-white">
                <h3 class="mb-0">Acessar Conta</h3>
            </div>
            <div class="card-body p-4">
                <?php if ($errorMessage): ?>
                    <div class="alert alert-danger"><?php echo htmlspecialchars($errorMessage); ?></div>
                <?php endif; ?>
                
                <form action="login.php" method="POST" id="loginForm" novalidate>
                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrfToken); ?>">
                    
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" class="form-control" id="email" name="email" value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>" required>
                        <div class="invalid-feedback">Por favor, insira seu email.</div>
                    </div>
                    
                    <div class="mb-4">
                        <label for="password" class="form-label">Senha</label>
                        <input type="password" class="form-control" id="password" name="password" required>
                        <div class="invalid-feedback">Por favor, insira sua senha.</div>
                    </div>
                    
                    <div class="d-grid">
                        <button type="submit" class="btn btn-primary btn-lg">Login</button>
                    </div>
                </form>
            </div>
            <div class="card-footer text-center py-3">
                <small>Não tem uma conta? <a href="register.php">Crie uma agora!</a></small>
                <br>
                <!-- <small><a href="forgot_password.php">Esqueceu sua senha?</a></small> -->
            </div>
        </div>
    </div>
</div>

<?php
// $pageScripts = ['auth.js']; // Se houver JS específico para login
require_once __DIR__ . '/../src/Templates/footer.php';
?> 
