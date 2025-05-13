// public/api/get_api_key_status.php
<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Config/AppConfig.php';
require_once __DIR__ . '/../../src/Core/Auth.php';
require_once __DIR__ . '/../../src/Core/User.php';

$auth = new Auth(); 
$debug_info = ['isLoggedIn' => false, 'userId' => null, 'db_api_key_encrypted' => null, 'decryption_attempted' => false, 'decrypted_api_key_preview' => null, 'openssl_error' => null];

if (!$auth->isLoggedIn()) {
    $debug_info['reason'] = 'Not authenticated';
    echo json_encode(['hasApiKey' => false, 'keySeemsValid' => false, 'debug' => $debug_info]);
    exit;
}
$debug_info['isLoggedIn'] = true;
$userId = $auth->getUserId();
$debug_info['userId'] = $userId;

$user = new User();
$userData = $user->getById($userId);

$hasApiKeyStored = false;
$keySeemsValid = false;

if ($userData && !empty($userData['api_key_encrypted'])) {
    $hasApiKeyStored = true;
    $debug_info['db_api_key_encrypted'] = substr($userData['api_key_encrypted'], 0, 20) . '...'; // Preview da chave criptografada
    
    // Limpar erros OpenSSL anteriores
    while (openssl_error_string() !== false); 

    $decryptedApiKey = Auth::decryptApiKey($userData['api_key_encrypted']);
    $debug_info['decryption_attempted'] = true;

    $last_openssl_error = openssl_error_string();
    if ($last_openssl_error) {
        $debug_info['openssl_error'] = $last_openssl_error;
    }

    if ($decryptedApiKey !== null) {
        $keySeemsValid = true; 
        $debug_info['decrypted_api_key_preview'] = substr($decryptedApiKey, 0, 5) . str_repeat('*', max(0, strlen($decryptedApiKey) - 10)) . substr($decryptedApiKey, -5);
    } else {
        $debug_info['decrypted_api_key_preview'] = 'DECRYPTION_FAILED';
    }
} else {
    $debug_info['reason'] = 'No API key found in DB for user.';
}

echo json_encode(['hasApiKey' => $hasApiKeyStored, 'keySeemsValid' => $keySeemsValid, 'debug' => $debug_info]);
exit;
?>