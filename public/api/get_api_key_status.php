// public/api/get_api_key_status.php
<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Config/AppConfig.php';
require_once __DIR__ . '/../../src/Core/Auth.php';
require_once __DIR__ . '/../../src/Core/User.php';

$auth = new Auth(); 
if (!$auth->isLoggedIn()) {
    echo json_encode(['hasApiKey' => false, 'reason' => 'Not authenticated', 'keySeemsValid' => false]);
    exit;
}
$user = new User();
$userData = $user->getById($auth->getUserId());

$hasApiKeyStored = false; // Se existe algo no campo api_key_encrypted
$keySeemsValid = false;   // Se o que está lá pôde ser descriptografado

if ($userData && !empty($userData['api_key_encrypted'])) {
    $hasApiKeyStored = true;
    $decryptedApiKey = Auth::decryptApiKey($userData['api_key_encrypted']);
    if ($decryptedApiKey !== null) {
        $keySeemsValid = true; 
    }
}

echo json_encode(['hasApiKey' => $hasApiKeyStored, 'keySeemsValid' => $keySeemsValid]);
exit;
?>