<?php
// Definições Globais da Aplicação
define('APP_NAME', 'AI Prompt Generator Pro');

// Configure BASE_URL corretamente para o seu ambiente XAMPP.
// Se você acessar o projeto como http://localhost/ai-prompt-generator-pro/public/
// então BASE_URL deve ser 'http://localhost/ai-prompt-generator-pro/public'
// Se você configurar um VirtualHost (ex: http://aiprompt.test) que aponta para a pasta public/,
// então BASE_URL seria 'http://aiprompt.test'
define('BASE_URL', 'http://localhost/ai-prompt-generator-pro/public');

// Chave de Criptografia para a API Key do Usuário
// IMPORTANTE: Gere uma chave forte e única para sua aplicação.
// Use, por exemplo, `openssl_random_pseudo_bytes(32)` para gerar uma.
// NÃO USE ESTA CHAVE PADRÃO EM PRODUÇÃO.
define('ENCRYPTION_KEY', 'ColoqueSuaChaveDe32BytesSuperSecretaAqui!'); // Exemplo: base64_encode(openssl_random_pseudo_bytes(32))
define('ENCRYPTION_CIPHER', 'AES-256-CBC'); // Algoritmo de criptografia

// Configurações de Sessão
define('SESSION_NAME', 'AI_PROMPT_GEN_SESS');
define('SESSION_TIMEOUT_SECONDS', 1800); // 30 minutos

// Configurações de API (se você tiver uma chave de API global para o app, o que não é o caso aqui, pois cada usuário tem a sua)
// define('GLOBAL_API_KEY', 'sua_api_key_global_se_necessario');

// Configurações de Email (se for implementar recuperação de senha, etc.)
// define('SMTP_HOST', 'smtp.example.com');
// define('SMTP_PORT', 587);
// define('SMTP_USER', 'user@example.com');
// define('SMTP_PASS', 'password');
// define('MAIL_FROM_ADDRESS', 'noreply@example.com');
// define('MAIL_FROM_NAME', APP_NAME);

// Outras configurações
define('DEBUG_MODE', true); // Defina como false em produção

// Habilitar error reporting para desenvolvimento
if (DEBUG_MODE) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(0);
    // Em produção, você deve logar os erros em um arquivo em vez de exibi-los.
    // ini_set('log_errors', 1);
    // ini_set('error_log', '/path/to/your/php-error.log');
}
?> 
