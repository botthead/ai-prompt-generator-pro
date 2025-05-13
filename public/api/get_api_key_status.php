<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Config/AppConfig.php'; // Inclui config e pode iniciar sessão via Auth
require_once __DIR__ . '/../../src/Core/Auth.php';
require_once __DIR__ . '/../../src/Core/User.php';

$auth = new Auth(); // Construtor do Auth já lida com session_start

if (!$auth->isLoggedIn()) {
    // Para este endpoint específico, é ok retornar hasApiKey: false em vez de 401,
    // pois o JS do dashboard espera uma resposta para atualizar a UI.
    echo json_encode(['hasApiKey' => false, 'reason' => 'Not authenticated']);
    exit;
}

$user = new User();
$userData = $user->getById($auth->getUserId());

$hasApiKey = false;
$isValidAttempt = false; // Indica se a descriptografia foi tentada e se a chave parecia válida

if ($userData && !empty($userData['api_key_encrypted'])) {
    $decryptedApiKey = Auth::decryptApiKey($userData['api_key_encrypted']);
    if ($decryptedApiKey !== null) {
        // A chave foi descriptografada com sucesso. Não significa que é VÁLIDA para a API Gemini,
        // apenas que está armazenada e foi descriptografada corretamente com a ENCRYPTION_KEY.
        $hasApiKey = true;
        $isValidAttempt = true; 
    } else {
        // Chave está no banco, mas falhou ao descriptografar (ENCRYPTION_KEY errada ou dados corrompidos)
        $hasApiKey = false; // Consideramos que não tem uma chave utilizável
        $isValidAttempt = false; // Indica que a chave armazenada é problemática
    }
}

echo json_encode(['hasApiKey' => $hasApiKey, 'keySeemsValid' => $isValidAttempt]);
exit;
?>