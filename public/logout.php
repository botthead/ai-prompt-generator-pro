<?php
// Não precisa de $pageTitle ou header/footer HTML, pois apenas processa e redireciona.
require_once __DIR__ . '/../src/Core/Auth.php'; // Auth.php já lida com session_start e AppConfig

$auth = new Auth();
$auth->logout(); // O método logout() já redireciona para login.php
// Nenhum código adicional é necessário aqui.
?> 
