<?php
// Assegura que AppConfig.php seja carregado primeiro para ter as constantes.
require_once __DIR__ . '/../Config/AppConfig.php';

// Inicia a sessão se ainda não estiver iniciada, usando as configurações de AppConfig.php
if (session_status() == PHP_SESSION_NONE) {
    session_name(SESSION_NAME); 
    session_set_cookie_params([
        'lifetime' => SESSION_TIMEOUT_SECONDS,
        'path' => '/', 
        'domain' => '', 
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

// Gerar token CSRF para a meta tag.
// A classe Auth deve ser carregada para usar Auth::generateCsrfToken().
// Se nav.php (incluído abaixo) já usa Auth, ela será carregada.
// Caso contrário, um require_once aqui seria prudente.
if (!class_exists('Auth')) {
    require_once __DIR__ . '/../Core/Auth.php';
}
$csrfTokenForMeta = Auth::generateCsrfToken();
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($pageTitle) ? htmlspecialchars($pageTitle) . ' - ' . htmlspecialchars(APP_NAME) : htmlspecialchars(APP_NAME); ?></title>
    
    <!-- CSRF Token para AJAX Requests -->
    <meta name="csrf-token" content="<?php echo htmlspecialchars($csrfTokenForMeta); ?>">
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    
    <!-- FontAwesome CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    
    <!-- SweetAlert2 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css" rel="stylesheet">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="<?php echo htmlspecialchars(BASE_URL); ?>/assets/css/style.css">
    
    <style>
        body {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            padding-top: 70px; /* Ajuste se a altura da navbar fixa (navbar-dark tem padding, então 70px pode ser mais adequado) */
        }
        .main-content { /* Este é o container principal para o conteúdo da página */
            flex: 1; /* Faz com que o conteúdo principal ocupe o espaço disponível */
        }
        /* Footer já tem estilos em style.css, mas podemos garantir que ele fique no final */
        /* #loadingOverlay já está no style.css, não precisa duplicar aqui */
    </style>
</head>
<body>

<?php
// Inclui a barra de navegação.
include_once __DIR__ . '/nav.php';
?>

<div class="main-content container mt-4 mb-5">
    <?php
    // Exibir mensagens flash (sucesso, erro, info)
    if (isset($_SESSION['success_message'])) {
        echo '<div class="alert alert-success alert-dismissible fade show" role="alert">' .
             htmlspecialchars($_SESSION['success_message']) .
             '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
        unset($_SESSION['success_message']);
    }
    if (isset($_SESSION['error_message'])) {
        echo '<div class="alert alert-danger alert-dismissible fade show" role="alert">' .
             htmlspecialchars($_SESSION['error_message']) .
             '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
        unset($_SESSION['error_message']);
    }
    if (isset($_SESSION['info_message'])) {
        echo '<div class="alert alert-info alert-dismissible fade show" role="alert">' .
             htmlspecialchars($_SESSION['info_message']) .
             '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
        unset($_SESSION['info_message']);
    }
    ?>
    <!-- O CONTEÚDO DA PÁGINA ESPECÍFICA COMEÇA DEPOIS DESTE HEADER -->
    <!-- E O FOOTER.PHP FECHARÁ O <div class="main-content container...">, <body> e <html> -->