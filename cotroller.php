<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/controller_error.log');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Неверный метод запроса.']);
    exit;
}

// Поддерживаем как JSON, так и POST для совместимости
$action = null;
$input = file_get_contents("php://input");
$jsonData = json_decode($input, true);

// Проверяем JSON данные
if ($jsonData && isset($jsonData['action'])) {
    $action = $jsonData['action'];
    $_POST = array_merge($_POST, $jsonData); // Добавляем JSON данные в $_POST для совместимости
}
// Проверяем POST данные (старый способ)
elseif (isset($_POST['action'])) {
    $action = $_POST['action'];
}

$response = ['success' => false, 'message' => 'Неизвестная ошибка или действие.'];

error_log("=== Controller called with action: " . ($action ?? 'none') . " ===");
error_log("Request data: " . ($input ?: 'POST only'));
error_log("JSON data: " . json_encode($jsonData));
error_log("POST data: " . json_encode($_POST));

try {
    chdir(__DIR__ . '/../');

    if (!file_exists('config.inc.php')) {
        throw new Exception('config.inc.php не найден');
    }

    require_once 'config.inc.php';
    require_once 'include/utils/utils.php';
    require_once 'vtlib/Vtiger/Module.php';
    require_once 'Logger.php';
    include_once 'includes/runtime/BaseModel.php';
    include_once 'includes/runtime/Globals.php';
    include_once 'includes/runtime/Controller.php';
    include_once 'includes/http/Request.php';

    global $adb, $current_user;
    $current_user = Users::getActiveAdminUser();

    if (!isset($adb) || !$adb) {
        $adb = PearDatabase::getInstance();
    }

    if (!$adb) {
        throw new Exception('Не удалось подключиться к базе данных');
    }

    $testResult = $adb->query("SELECT 1 as test");
    if (!$testResult) {
        throw new Exception('База данных недоступна');
    }

    error_log("Database connection successful");

} catch (Exception $e) {
    error_log("Database connection error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Ошибка подключения к базе данных: ' . $e->getMessage()]);
    exit;
}

try {
    switch ($action) {
        case 'checkUser':
            $username = isset($_POST['username']) ? trim($_POST['username']) : null;
            $hashed_password_from_client = isset($_POST['hashed_password']) ? trim($_POST['hashed_password']) : null;

            if (empty($username) || empty($hashed_password_from_client)) {
                $response = ['success' => false, 'message' => 'Не указан логин или пароль.'];
                break;
            }

            error_log("DEBUG: checkUser - username: " . $username);

            $query = "SELECT u.id, u.user_name, u.user_password, u.status, u.first_name, u.last_name 
                      FROM vtiger_users AS u 
                      WHERE u.user_name = ? AND u.deleted = 0";
            $result = $adb->pquery($query, array($username));

            if ($adb->num_rows($result) > 0) {
                $row = $adb->fetchByAssoc($result);
                $stored_hashed_password = $row['user_password'];
                $fullname = trim($row['first_name'] . ' ' . $row['last_name']);

                if ($hashed_password_from_client === $stored_hashed_password) {
                    if ($row['status'] == 'Inactive') {
                        $response = ['success' => false, 'message' => 'Ваша учетная запись неактивна.'];
                    } else {
                        $response = [
                            'success' => true,
                            'message' => 'Авторизация Vtiger прошла успешно!',
                            'user_id' => $row['id'],
                            'username' => $row['user_name'],
                            'fullname' => $fullname
                        ];
                    }
                } else {
                    $response = ['success' => false, 'message' => 'Неверный логин или пароль.'];
                }
            } else {
                $response = ['success' => false, 'message' => 'Пользователь не найден.'];
            }
            break;

        case "checkAuth":
            $phoneIdentifier = isset($_POST['phoneIdentifier']) ? trim($_POST['phoneIdentifier']) : null;

            if (empty($phoneIdentifier)) {
                $response = ['success' => false, 'message' => 'Отсутствует идентификатор телефона.'];
                break;
            }

            $query = "SELECT ba.vtiger_user_id, ba.expiration, vu.user_name, vu.status, vu.first_name, vu.last_name
                      FROM bot_auth ba
                      INNER JOIN vtiger_users vu ON ba.vtiger_user_id = vu.id
                      WHERE ba.telegramid = ? AND vu.deleted = 0";
            $result = $adb->pquery($query, array($phoneIdentifier));

            if ($adb->num_rows($result) > 0) {
                $row = $adb->fetchByAssoc($result);
                $expiration_timestamp = strtotime($row['expiration']);
                $fullname = trim($row['first_name'] . ' ' . $row['last_name']);

                if (time() < $expiration_timestamp && $row['status'] == 'Active') {
                    $response = [
                        'success' => true,
                        'data' => [
                            'vtiger_user_id' => $row['vtiger_user_id'],
                            'username' => $row['user_name'],
                            'expiration' => $row['expiration'],
                            'fullname' => $fullname
                        ]
                    ];
                } else {
                    $adb->pquery("DELETE FROM bot_auth WHERE telegramid = ?", array($phoneIdentifier));
                    $response = ['success' => true, 'data' => 'empty', 'message' => 'Сессия истекла или пользователь неактивен.'];
                }
            } else {
                $response = ['success' => true, 'data' => 'empty', 'message' => 'Нет активной авторизации.'];
            }
            break;

        case 'updateAuth':
            $vtiger_user_id = isset($_POST['vtiger_user_id']) ? trim($_POST['vtiger_user_id']) : null;
            $phoneIdentifier = isset($_POST['phoneIdentifier']) ? trim($_POST['phoneIdentifier']) : null;

            if (empty($vtiger_user_id) || empty($phoneIdentifier)) {
                $response = ['success' => false, 'message' => 'Отсутствуют необходимые параметры.'];
                break;
            }

            $query = "UPDATE bot_auth SET expiration = DATE_ADD(NOW(), INTERVAL 7 DAY), vtiger_user_id = ? WHERE telegramid = ?";
            $result = $adb->pquery($query, array($vtiger_user_id, $phoneIdentifier));

            if ($result) {
                $response = ['success' => true, 'message' => 'Авторизация обновлена.'];
            } else {
                $response = ['success' => false, 'message' => 'Ошибка при обновлении авторизации.'];
            }
            break;

        case 'addAuth':
            $phoneIdentifier = isset($_POST['phoneIdentifier']) ? trim($_POST['phoneIdentifier']) : null;
            $vtiger_user_id = isset($_POST['vtiger_user_id']) ? trim($_POST['vtiger_user_id']) : null;

            if (empty($phoneIdentifier) || empty($vtiger_user_id)) {
                $response = ['success' => false, 'message' => 'Отсутствуют необходимые параметры.'];
                break;
            }

            $adb->pquery("DELETE FROM bot_auth WHERE telegramid = ?", array($phoneIdentifier));
            $query = "INSERT INTO bot_auth (telegramid, vtiger_user_id, expiration) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))";
            $result = $adb->pquery($query, array($phoneIdentifier, $vtiger_user_id));

            if ($result) {
                $response = ['success' => true, 'message' => 'Новая авторизация добавлена.'];
            } else {
                $response = ['success' => false, 'message' => 'Ошибка при добавлении авторизации.'];
            }
            break;

        case 'logout':
            $phoneIdentifier = isset($_POST['phoneIdentifier']) ? trim($_POST['phoneIdentifier']) : null;

            if (empty($phoneIdentifier)) {
                $response = ['success' => false, 'message' => 'Отсутствует идентификатор телефона.'];
                break;
            }

            $query = "DELETE FROM bot_auth WHERE telegramid = ?";
            $result = $adb->pquery($query, array($phoneIdentifier));
            $response = ['success' => true, 'message' => 'Пользователь успешно вышел из системы.'];
            break;

        case 'searchSubscribers':
            try {
                $mpId = isset($_POST['mp_id']) ? trim($_POST['mp_id']) : '';
                $fio = isset($_POST['fio']) ? trim($_POST['fio']) : '';
                $accountNumber = isset($_POST['account_number']) ? trim($_POST['account_number']) : '';

                error_log("=== SEARCH BY MP START ===");
                error_log("Search parameters: mp_id={$mpId}, fio={$fio}, account={$accountNumber}");

                if (empty($mpId)) {
                    $response = ['success' => false, 'message' => 'Не выбрано Муниципальное предприятие'];
                    break;
                }

                // Базовый запрос для поиска по МП
                // Предполагаем, что mp_id=1 это "Таш-Кумырское ТС"
                $baseQuery = "SELECT
                                ve.estate_number AS account_number,
                                COALESCE(vcd.lastname, 'Нет контакта') AS full_name,
                                COALESCE(ve.cf_inhabited_locality, 'Не указан') AS locality,
                                COALESCE(ve.cf_streets, 'Не указана') AS street,
                                COALESCE(ve.cf_house_number, '') AS house_num,
                                COALESCE(ve.cf_litera, '') AS litera,
                                COALESCE(ve.cf_apartment_number, 'Не указана') AS flat,
                                COALESCE(ve.cf_balance, 0) AS balance,
                                ve.estatesid AS id,
                                COALESCE(vcd.phone, '') AS phone,
                                CONCAT(
                                    COALESCE(ve.cf_inhabited_locality, ''), ', ',
                                    COALESCE(ve.cf_streets, ''), ', ',
                                    COALESCE(ve.cf_house_number, ''),
                                    COALESCE(ve.cf_litera, ''),
                                    IF(ve.cf_apartment_number IS NOT NULL AND ve.cf_apartment_number != '', 
                                       CONCAT(', кв. ', ve.cf_apartment_number), '')
                                ) AS full_address
                              FROM vtiger_estates ve
                              INNER JOIN vtiger_crmentity vc ON vc.crmid = ve.estatesid
                              LEFT JOIN vtiger_contactdetails vcd ON vcd.contactid = ve.cf_contact_id
                              WHERE vc.deleted = 0 
                              AND ve.cf_deactivated = '0'";

                // Если у вас есть поле для привязки к МП (например cf_municipal_enterprise_id), 
                // добавьте условие: AND ve.cf_municipal_enterprise_id = ?
                // Для примера считаем, что все записи относятся к выбранному МП

                $conditions = array();
                $params = array();

                // Фильтр по лицевому счёту
                if (!empty($accountNumber)) {
                    $conditions[] = "ve.estate_number LIKE ?";
                    $params[] = '%' . $accountNumber . '%';
                    error_log("Added account filter: " . $accountNumber);
                }

                // Фильтр по ФИО
                if (!empty($fio)) {
                    $conditions[] = "vcd.lastname LIKE ?";
                    $params[] = '%' . $fio . '%';
                    error_log("Added FIO filter: " . $fio);
                }

                // Собираем финальный запрос
                if (count($conditions) > 0) {
                    $baseQuery .= " AND " . implode(" AND ", $conditions);
                }

                $baseQuery .= " ORDER BY ve.estate_number ASC LIMIT 500";

                error_log("Final MP search query: " . $baseQuery);
                error_log("Query params: " . json_encode($params));

                $result = $adb->pquery($baseQuery, $params);

                if ($result === false) {
                    $errorMessage = $adb->database->ErrorMsg();
                    error_log("SQL Error in MP search: " . $errorMessage);
                    $response = ['success' => false, 'message' => 'SQL ошибка при поиске: ' . $errorMessage];
                    break;
                }

                $subscribers = array();
                $rowCount = $adb->num_rows($result);
                error_log("MP search found {$rowCount} subscribers");

                while ($row = $adb->fetchByAssoc($result)) {
                    $house = trim($row['house_num'] . $row['litera']);

                    $subscribers[] = array(
                        'id' => $row['id'],
                        'account_number' => $row['account_number'] ?: 'Не указан',
                        'full_name' => $row['full_name'] ?: 'Не указано',
                        'locality' => $row['locality'] ?: 'Не указан',
                        'street' => $row['street'] ?: 'Не указана',
                        'house' => $house ?: 'Не указан',
                        'flat' => $row['flat'] ?: 'Не указана',
                        'address' => $row['full_address'],
                        'phone' => $row['phone'] ?: '',
                        'balance' => $row['balance'] ?? '0'
                    );
                }

                error_log("Final subscribers array count: " . count($subscribers));
                error_log("=== SEARCH BY MP END ===");

                $response = [
                    'success' => true,
                    'message' => 'Поиск завершен.',
                    'data' => $subscribers,
                    'count' => count($subscribers)
                ];

            } catch (Exception $e) {
                error_log("Error in searchSubscribers (MP): " . $e->getMessage());
                error_log("Stack trace: " . $e->getTraceAsString());
                $response = ['success' => false, 'message' => 'Ошибка при поиске абонентов: ' . $e->getMessage()];
            }
            break;

        case 'getServices':
            try {
                // Получаем услуги из таблицы cf_paid_service
                $query = "SELECT cf_paid_serviceid, cf_paid_service 
                          FROM vtiger_cf_paid_service 
                          ORDER BY cf_paid_service ASC";

                error_log("Executing services query from vtiger_cf_paid_service");
                $result = $adb->pquery($query, array());

                if ($result === false) {
                    $response = ['success' => false, 'message' => 'Ошибка базы данных при получении услуг.'];
                    break;
                }

                $services = array();
                while ($row = $adb->fetchByAssoc($result)) {
                    $services[] = array(
                        'id' => $row['cf_paid_serviceid'],
                        'name' => $row['cf_paid_service']
                    );
                }

                error_log("Found " . count($services) . " services from cf_paid_service");
                $response = ['success' => true, 'message' => 'Услуги получены.', 'services' => $services];
            } catch (Exception $e) {
                error_log("Error in getServices: " . $e->getMessage());
                $response = ['success' => false, 'message' => 'Ошибка при получении услуг: ' . $e->getMessage()];
            }
            break;

        case 'processPayment':
            $ls = isset($_POST['ls']) ? trim($_POST['ls']) : null;
            $serviceId = isset($_POST['service_id']) ? trim($_POST['service_id']) : null;
            $service = isset($_POST['service']) ? trim($_POST['service']) : null;
            $amount = isset($_POST['amount']) ? floatval($_POST['amount']) : 0;
            $paymentType = isset($_POST['payment_type']) ? trim($_POST['payment_type']) : null;
            $date = isset($_POST['date']) ? trim($_POST['date']) : date('Y-m-d');
            $userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 1;
            $rnn = isset($_POST['rnn']) ? trim($_POST['rnn']) : null; // RNN от MegaPay

            if (empty($ls) || empty($serviceId) || $amount <= 0 || empty($paymentType)) {
                $response = ['success' => false, 'message' => 'Неверные или отсутствующие данные для платежа.'];
                break;
            }

            try {
                // Проверяем объект
                $sql_bot = "SELECT ve.estatesid, ve.cf_balance, ve.cf_field_municipal_enterprise FROM vtiger_estates ve 
                    INNER JOIN vtiger_crmentity vc ON vc.crmid = ve.estatesid 
                    WHERE vc.deleted = 0 AND ve.estate_number = ?";
                $bot_info = $adb->pquery($sql_bot, [$ls]);

                if ($adb->num_rows($bot_info) === 0) {
                    $response = [
                        "success" => false,
                        "message" => "Лицевой счёт не найден"
                    ];
                    break;
                }

                $row = $adb->fetch_array($bot_info);
                $estatesid = $row['estatesid'];
                $balance = $row['cf_balance'];
                $municipal_enterprise = $row['cf_field_municipal_enterprise'];

                if ($paymentType == 'cash' || $paymentType == 'terminal') {
                    // Создаём запись платежа (универсальный код)
                    $payment = Vtiger_Record_Model::getCleanInstance("Payments");
                    $payment->set('cf_paid_object', $estatesid);
                    $payment->set('amount', $amount);
                    $payment->set('cf_pay_date', $date);
                    $payment->set('cf_pay_type', 'Приход');
                    $payment->set('cf_status', 'Выполнен');

                    // Определяем тип платежа в зависимости от способа оплаты
                    $paymentTypeText = ($paymentType == 'cash') ? 'Наличные' : 'Безналичный расчет';
                    $payment->set('cf_payment_type', $paymentTypeText);

                    $payment->set('cf_payment_source', 'PayMob');
                    $payment->set('cf_paid_service', $service);
                    $payment->set('assigned_user_id', $userId);

                    // Записываем RNN от MegaPay в cf_txnid (только для терминальных платежей)
                    if ($paymentType == 'terminal' && !empty($rnn)) {
                        $payment->set('cf_txnid', $rnn);
                    }

                    $payment->set('mode', 'create');
                    $payment->save();
                    $paymentId = $payment->getId();

                    $response = [
                        "success" => true,
                        "message" => "Платёж успешно сохранён",
                        "payment_id" => $paymentId
                    ];

                } else {
                    // Неизвестный тип платежа
                    $response = [
                        "success" => false,
                        "message" => "Неизвестный тип платежа: " . $paymentType
                    ];
                }

            } catch (Exception $e) {
                $response = [
                    "success" => false,
                    "message" => "Ошибка при обработке платежа: " . $e->getMessage()
                ];
            }
            break;

        default:
            $response = ['success' => false, 'message' => 'Неизвестное действие: ' . $action];
            break;
    }

} catch (Exception $e) {
    error_log("ERROR in controller: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    $response = ['success' => false, 'message' => 'Ошибка сервера: ' . $e->getMessage()];
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
exit;
?>