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

try {
    chdir(__DIR__ . '/../');

    if (!file_exists('config.inc.php')) {
        throw new Exception('config.inc.php не найден');
    }

    require_once 'config.inc.php';
    require_once 'include/utils/utils.php';

    global $adb;
    if (!isset($adb) || !$adb) {
        $adb = PearDatabase::getInstance();
    }

    if (!$adb) {
        throw new Exception('Не удалось подключиться к базе данных');
    }

    $action = null;
    $input = file_get_contents("php://input");
    $jsonData = json_decode($input, true);

    if ($jsonData && isset($jsonData['action'])) {
        $action = $jsonData['action'];
    }

    $response = ['success' => false, 'message' => 'Неизвестное действие'];

    switch ($action) {
        case 'getOperatorLogin':
            $serialNumber = isset($jsonData['serial_number']) ? trim($jsonData['serial_number']) : null;

            if (empty($serialNumber)) {
                $response = ['success' => false, 'message' => 'Серийный номер не указан'];
                break;
            }

            $query = "SELECT operator_login FROM terminal_settings WHERE serial_number = ? LIMIT 1";
            $result = $adb->pquery($query, array($serialNumber));

            if ($adb->num_rows($result) > 0) {
                $row = $adb->fetchByAssoc($result);
                $response = [
                    'success' => true,
                    'operator_login' => $row['operator_login']
                ];
            } else {
                $response = [
                    'success' => false,
                    'message' => 'Оператор не найден для данного терминала',
                    'operator_login' => null
                ];
            }
            break;

        case 'saveOperatorLogin':
            $serialNumber = isset($jsonData['serial_number']) ? trim($jsonData['serial_number']) : null;
            $operatorLogin = isset($jsonData['operator_login']) ? trim($jsonData['operator_login']) : null;

            if (empty($serialNumber) || empty($operatorLogin)) {
                $response = ['success' => false, 'message' => 'Серийный номер или operator_login не указаны'];
                break;
            }

            // Проверяем, существует ли запись
            $checkQuery = "SELECT id FROM terminal_settings WHERE serial_number = ? LIMIT 1";
            $checkResult = $adb->pquery($checkQuery, array($serialNumber));

            if ($adb->num_rows($checkResult) > 0) {
                // Обновляем существующую запись
                $updateQuery = "UPDATE terminal_settings SET operator_login = ? WHERE serial_number = ?";
                $updateResult = $adb->pquery($updateQuery, array($operatorLogin, $serialNumber));

                if ($updateResult) {
                    $response = ['success' => true, 'message' => 'Настройки терминала обновлены'];
                } else {
                    $response = ['success' => false, 'message' => 'Ошибка обновления настроек'];
                }
            } else {
                // Создаем новую запись
                $insertQuery = "INSERT INTO terminal_settings (serial_number, operator_login) VALUES (?, ?)";
                $insertResult = $adb->pquery($insertQuery, array($serialNumber, $operatorLogin));

                if ($insertResult) {
                    $response = ['success' => true, 'message' => 'Настройки терминала сохранены'];
                } else {
                    $response = ['success' => false, 'message' => 'Ошибка сохранения настроек'];
                }
            }
            break;

        default:
            $response = ['success' => false, 'message' => 'Неизвестное действие: ' . $action];
            break;
    }

} catch (Exception $e) {
    error_log("ERROR in terminal_settings.php: " . $e->getMessage());
    $response = ['success' => false, 'message' => 'Ошибка сервера: ' . $e->getMessage()];
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
exit;
?>