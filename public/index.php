<?php
// Este arquivo atua como um ponto de entrada ou um simples redirecionador.
// Se você não estiver usando um roteador complexo, ele pode simplesmente
// verificar se o usuário está logado e redirecioná-lo.

// Garante que AppConfig.php seja carregado para ter BASE_URL e configurações de sessão.
require_once __DIR__ . '/../src/Config/AppConfig.php';

// A sessão já deve ter sido iniciada pelo header.php, mas é bom garantir
// se este arquivo for acessado diretamente sem passar por um que inclua o header.
if (session_status() == PHP_SESSION_NONE) {
    session_name(SESSION_NAME);
    session_start();
}

if (isset($_SESSION['user_id'])) {
    // Usuário está logado, redireciona para o dashboard.
    header("Location: " . BASE_URL . "/dashboard.php");
} else {
    // Usuário não está logado, redireciona para a página de login.
    header("Location: " . BASE_URL . "/login.php");
}
exit; // Importante para garantir que nenhum código adicional seja executado após o redirecionamento.
?> 
