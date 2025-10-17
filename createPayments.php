<?php
chdir('../');

header("Content-Type: application/json; charset=UTF-8");

require_once 'include/utils/utils.php';
require_once 'Logger.php';
include_once 'includes/runtime/BaseModel.php';
include_once 'includes/runtime/Globals.php';
include_once 'includes/runtime/Controller.php';
include_once 'includes/http/Request.php';

global $current_user;
global $adb;
$current_user = Users::getActiveAdminUser();

$input = file_get_contents("php://input");
$data = json_decode($input, true);

$summ       = $data['amount'] ?? null;
$ls         = $data['ls'] ?? null;
$service_id = $data['service_id'] ?? null;
$service    = $data['service'] ?? null;
$payment_type = $data['payment_type'] ?? 'cash';
$date       = $data['date'] ?? date('Y-m-d');

try {
    // Проверяем объект
    $sql_bot = "SELECT * FROM vtiger_estates ve 
        INNER JOIN vtiger_crmentity vc ON vc.crmid = ve.estatesid 
        WHERE vc.deleted = 0 AND ve.estate_number = ?";
    $bot_info = $adb->pquery($sql_bot, [$ls]);
    
    if ($adb->num_rows($bot_info) === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Лицевой счёт не найден"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $row = $adb->fetch_array($bot_info);
    $estatesid = $row['estatesid'];
    $balance = $row['cf_balance'];
    $municipal_enterprise = $row['cf_field_municipal_enterprise'];

    if($payment_type == 'cash'){
        // Создаём запись платежа
        $payment = Vtiger_Record_Model::getCleanInstance("Payments");
        $payment->set('cf_paid_object', $estatesid);
        $payment->set('amount', $summ);
        $payment->set('cf_pay_date', $date);
        $payment->set('cf_pay_type', 'Приход');
        $payment->set('cf_status', 'Выполнен');
        $payment->set('cf_payment_type', 'Наличные');
        $payment->set('cf_payment_source', 'Касса организации');
        $payment->set('cf_paid_service', $service);
        $payment->set('assigned_user_id', 1);
        $payment->set('mode', 'create');
        $payment->save();
        $paymentId = $payment->getId();

        echo json_encode([
            "success" => true,
            "message" => "Платёж успешно сохранён",
            "payment_id" => $paymentId
        ], JSON_UNESCAPED_UNICODE);

    } else {
        $qrCodeData = getQrCode($municipal_enterprise);

        if (!empty($qrCodeData)) {
            $qrUrl = generateQrCodeUrl($qrCodeData, $ls, $service, $summ);

            if ($qrUrl) {
                echo json_encode([
                    "success" => true,
                    "qr_url" => $qrUrl
                ], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode([
                    "success" => false,
                    "message" => "Не удалось получить QR URL"
                ], JSON_UNESCAPED_UNICODE);
            }
        }
    }

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Ошибка при сохранении платежа: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

// Функция получения данных для QR
function getQrCode($municipal_enterprise) {
    global $adb;

    $result = $adb->run_query_allrecords(
        "SELECT vp.cf_qr_check,
                vp.cf_qr_service_id,
                vp.cf_qr_url,
                vp.cf_qr_login,
                vp.cf_qr_password 
         FROM vtiger_pymentssystem vp 
         WHERE vp.payer_title = 'MegaPay'
         AND vp.cf_qr_check = 'Подключен' AND vp.cf_company = '$municipal_enterprise'"
    );

    if ($result && count($result) > 0) {
        return $result[0];
    }

    return [];
}

// Функция получения URL QR-кода
function generateQrCodeUrl($qrCodeData, $invoice_no, $servicenameinvoice, $total_invoice) {
    $postData = [
        'serviceId' => $qrCodeData['cf_qr_service_id'],
        'destination' => $invoice_no,
        'paymentComment' => $servicenameinvoice,
        'paymentAmount' => $total_invoice,
        'amountEditable' => false,
        'qrType' => 'DYNAMIC',
        'destinationEditable' => false,
        'qrTransactionId' => ''
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $qrCodeData['cf_qr_url']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Basic ' . base64_encode($qrCodeData['cf_qr_login'] . ':' . $qrCodeData['cf_qr_password'])
    ]);

    $response = curl_exec($ch);
    curl_close($ch);
    $responseData = json_decode($response, true);

    if ($responseData['status'] == 'SUCCESS' && isset($responseData['data'])) {
        return $responseData['data']; // Возвращаем сразу URL
    }

    return null;
}
