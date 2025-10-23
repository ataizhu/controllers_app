<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    // Проверяем, существует ли файл с токеном
    if (!file_exists('tokens.json')) {
        echo json_encode([
            'success' => false,
            'error' => 'Token file not found',
            'token' => null,
            'expiresAt' => null,
            'isExpired' => true
        ]);
        exit;
    }

    // Читаем токен
    $tokenData = json_decode(file_get_contents('tokens.json'), true);

    if (!$tokenData) {
        echo json_encode([
            'success' => false,
            'error' => 'Invalid token data',
            'token' => null,
            'expiresAt' => null,
            'isExpired' => true
        ]);
        exit;
    }

    // Проверяем срок действия токена (с запасом в 30 секунд)
    $expiresAt = new DateTime($tokenData['expiresAt']);
    $now = new DateTime();
    $timeBuffer = new DateInterval('PT30S'); // 30 секунд запаса
    $expiresAtWithBuffer = clone $expiresAt;
    $expiresAtWithBuffer->sub($timeBuffer);

    $isExpired = $expiresAtWithBuffer <= $now;

    // Возвращаем данные о токене
    echo json_encode([
        'success' => true,
        'token' => $tokenData['token'],
        'expiresAt' => $tokenData['expiresAt'],
        'isExpired' => $isExpired,
        'opLogin' => $tokenData['opLogin'],
        'receivedAt' => $tokenData['receivedAt'],
        'timeLeft' => $isExpired ? 0 : $expiresAt->getTimestamp() - $now->getTimestamp()
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage(),
        'token' => null,
        'expiresAt' => null,
        'isExpired' => true
    ]);
}
?>