<?php
// Устанавливаем часовой пояс GMT+6
date_default_timezone_set('Asia/Bishkek');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Загружаем конфигурацию
$config = require 'config.php';

// Получаем данные из запроса
$input = file_get_contents('php://input');
$jsonData = json_decode($input, true);
$serialNumber = isset($jsonData['serial_number']) ? trim($jsonData['serial_number']) : null;

// Получаем operator_login из БД по серийному номеру
$operatorLogin = null;
$errorMessage = null;

// Проверяем наличие серийного номера
if (!$serialNumber) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Серийный номер терминала не передан',
        'message' => 'Серийный номер терминала не передан. Пожалуйста, настройте терминал через кнопку настроек.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    chdir(__DIR__ . '/../');

    if (file_exists('config.inc.php')) {
        require_once 'config.inc.php';
        require_once 'include/utils/utils.php';

        global $adb;
        if (!isset($adb) || !$adb) {
            $adb = PearDatabase::getInstance();
        }

        if ($adb) {
            $query = "SELECT operator_login FROM terminal_settings WHERE serial_number = ? LIMIT 1";
            $result = $adb->pquery($query, array($serialNumber));

            if ($adb->num_rows($result) > 0) {
                $row = $adb->fetchByAssoc($result);
                $operatorLogin = $row['operator_login'];

                // Проверяем что operator_login не пустой
                if (empty($operatorLogin)) {
                    $errorMessage = 'Для данного терминала не настроен operator_login. Пожалуйста, настройте его через кнопку настроек терминала.';
                }
            } else {
                $errorMessage = 'Для данного терминала не настроен operator_login. Пожалуйста, настройте его через кнопку настроек терминала.';
            }
        } else {
            $errorMessage = 'Ошибка подключения к базе данных';
        }
    } else {
        $errorMessage = 'Файл конфигурации не найден';
    }
} catch (Exception $e) {
    error_log("Error getting operator_login: " . $e->getMessage());
    $errorMessage = 'Ошибка получения настроек терминала: ' . $e->getMessage();
}

// Если operator_login не найден в БД - возвращаем ошибку
if (!$operatorLogin || $errorMessage) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => $errorMessage ?: 'Operator login не найден',
        'message' => $errorMessage ?: 'Для данного терминала не настроен operator_login. Пожалуйста, настройте его через кнопку настроек терминала.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Конфигурация из файла
$megaPayUrl = $config['megapay']['url'];
$callbackUrl = $config['megapay']['callback_url'];

$requestData = [
    '@MsgNum' => uniqid('req_', true), // Генерируем уникальный ID
    'OpLogin' => $operatorLogin,
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
header('Content-Type: application/json');
echo json_encode([
    'success' => $result['httpCode'] === 200 && !$result['error'],
    'httpCode' => $result['httpCode'],
    'error' => $result['error'],
    'response' => $result['response'] ? json_decode($result['response'], true) : null,
    'operator_login_used' => $operatorLogin
], JSON_UNESCAPED_UNICODE);
exit;
?>