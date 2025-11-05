<?php
// Устанавливаем часовой пояс GMT+6 в самом начале
date_default_timezone_set('Asia/Bishkek');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Логирование входящих запросов
function logRequest($data) {
    $logFile = 'token_requests.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] " . json_encode($data) . "\n", FILE_APPEND);
}

// Получаем данные из POST запроса
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    // Логируем только ошибки
    logRequest(['type' => 'ERROR - Invalid JSON data', 'input' => $input]);
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid JSON data'
    ]);
    exit;
}

// Проверяем обязательные поля
$requiredFields = ['@MsgNum', 'OpLogin', 'Token', 'TokenTimeout', 'ServerTime'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field])) {
        // Логируем только ошибки
        logRequest(['type' => 'ERROR - Missing required field', 'field' => $field, 'data' => $data]);
        http_response_code(400);
        echo json_encode([
            'error' => "Missing required field: $field"
        ]);
        exit;
    }
}

// Сохраняем токен в файл или базу данных
$tokenData = [
    'msgNum' => $data['@MsgNum'],
    'opLogin' => $data['OpLogin'],
    'token' => $data['Token'],
    'tokenTimeout' => $data['TokenTimeout'],
    'serverTime' => $data['ServerTime'],
    'receivedAt' => date('Y-m-d H:i:s'),
    'expiresAt' => date('Y-m-d H:i:s', time() + $data['TokenTimeout'])
];

// Сохраняем в файл (можно заменить на базу данных)
$saveResult = file_put_contents('tokens.json', json_encode($tokenData, JSON_PRETTY_PRINT));

// Проверяем успешность сохранения
if ($saveResult === false) {
    // Логируем только ошибки
    logRequest(['type' => 'ERROR - Failed to save token', 'tokenData' => $tokenData]);
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to save token'
    ]);
    exit;
}

// Формируем ответ согласно протоколу
$response = [
    '@MsgNum' => $data['@MsgNum'],
    'ServerTime' => date('d.m.Y H:i:s T'),
    'Response' => [
        'Code' => '00',
        'Description' => 'OK',
        'Info' => 'Token successfully received and stored'
    ]
];

echo json_encode($response);
?>