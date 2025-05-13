<?php
// Assegura que AppConfig.php seja carregado primeiro para ter as constantes.
// __DIR__ resolve o caminho absoluto para o diretório atual do arquivo.
require_once __DIR__ . '/../Config/AppConfig.php';

// Inicia a sessão se ainda não estiver iniciada, usando as configurações de AppConfig.php
if (session_status() == PHP_SESSION_NONE) {
    session_name(SESSION_NAME); // Define o nome da sessão antes de session_start()
    session_set_cookie_params([
        'lifetime' => SESSION_TIMEOUT_SECONDS,
        'path' => '/', // Ajuste o path se sua aplicação não estiver na raiz do domínio/subdomínio
        'domain' => '', // Deixe em branco para localhost ou defina seu domínio
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on', // True se HTTPS
        'httponly' => true,
        'samesite' => 'Lax' // Ou 'Strict' para maior segurança, mas pode quebrar fluxos OAuth/SAML
    ]);
    session_start();
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($pageTitle) ? htmlspecialchars($pageTitle) . ' - ' . htmlspecialchars(APP_NAME) : htmlspecialchars(APP_NAME); ?></title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    
    <!-- FontAwesome CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    
    <!-- SweetAlert2 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css" rel="stylesheet">
    
    <!-- CKEditor 5 (Se for carregar via CDN - considerar build local para produção) -->
    <!-- <script src="https://cdn.ckeditor.com/ckeditor5/41.4.2/classic/ckeditor.js"></script> -->
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="<?php echo htmlspecialchars(BASE_URL); ?>/assets/css/style.css">
    
    <style>
        body {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            padding-top: 56px; /* Altura da navbar fixa */
        }
        .main-content {
            flex: 1;
        }
        .footer {
            background-color: #f8f9fa;
        }
        /* Para o spinner de carregamento global */
        #loadingOverlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.7);
            z-index: 1055; /* Acima da maioria dos elementos, mas abaixo de modais se necessário */
            display: none; /* Escondido por padrão */
            justify-content: center;
            align-items: center;
        }
        #loadingOverlay .spinner-border {
            width: 3rem;
            height: 3rem;
        }
    </style>
</head>
<body>

<?php
// Inclui a barra de navegação.
// __DIR__ garante que o caminho é relativo ao arquivo header.php.
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
