<?php
// Загружаем конфигурацию
$config = require 'config.php';

// Конфигурация из файла
$megaPayUrl = $config['megapay']['url'];
$callbackUrl = $config['megapay']['callback_url'];

$requestData = [
    '@MsgNum' => uniqid('req_', true), // Генерируем уникальный ID
    'OpLogin' => $config['megapay']['operator_login'],
    'SysLogin' => $config['megapay']['system_admin_login'],
    'SysPwd' => $config['megapay']['system_admin_password_hash'],
    'Lang' => $config['megapay']['language'],
    'Info' => $config['megapay']['system_info']
];

// Функция для логирования
function logRequest($data) {
    $logFile = 'token_requests.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] " . json_encode($data) . "\n", FILE_APPEND);
}

// Отправляем запрос
function sendGetTokenRequest($url, $data) {
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Для тестирования

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);

    curl_close($ch);

    return [
        'response' => $response,
        'httpCode' => $httpCode,
        'error' => $error
    ];
}

// Отправляем запрос
$result = sendGetTokenRequest($megaPayUrl, $requestData);

// Выводим результат
echo "<h2>Результат запроса GetToken:</h2>";
echo "<p><strong>HTTP Code:</strong> " . $result['httpCode'] . "</p>";

if ($result['error']) {
    echo "<p><strong>Ошибка cURL:</strong> " . $result['error'] . "</p>";
}

if ($result['response']) {
    $responseData = json_decode($result['response'], true);
    echo "<p><strong>Ответ сервера:</strong></p>";
    echo "<pre>" . json_encode($responseData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";

    if ($responseData && isset($responseData['Response']['Code']) && $responseData['Response']['Code'] === '00') {
        echo "<p style='color: green;'><strong>✅ Токен успешно получен!</strong></p>";
        echo "<p><strong>Токен:</strong> " . ($responseData['Token'] ?? 'Не указан') . "</p>";
        echo "<p><strong>Время жизни:</strong> " . ($responseData['TokenTimeout'] ?? 'Не указано') . " секунд</p>";
    } else {
        echo "<p style='color: red;'><strong>❌ Ошибка получения токена</strong></p>";
        echo "<p><strong>Код ошибки:</strong> " . ($responseData['Response']['Code'] ?? 'Неизвестно') . "</p>";
        echo "<p><strong>Описание:</strong> " . ($responseData['Response']['Description'] ?? 'Неизвестно') . "</p>";

        // Логируем только ошибочные запросы
        logRequest(['type' => 'ERROR - GetToken Failed', 'request' => $requestData, 'response' => $responseData]);
    }
} else {
    echo "<p style='color: red;'><strong>❌ Нет ответа от сервера</strong></p>";

    // Логируем только ошибочные запросы
    logRequest(['type' => 'ERROR - No Response', 'request' => $requestData, 'result' => $result]);
}

echo "<hr>";
echo "<p><strong>Callback URL для настройки в MegaPay:</strong> " . $callbackUrl . "</p>";
echo "<p><strong>Лог файл:</strong> token_requests.log</p>";
?>