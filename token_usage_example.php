<?php
// Функция для проверки и получения токена
function getValidToken() {
    $tokenFile = 'tokens.json';

    // Проверяем, есть ли сохраненный токен
    if (file_exists($tokenFile)) {
        $tokenData = json_decode(file_get_contents($tokenFile), true);

        // Проверяем, не истек ли токен
        $expiresAt = strtotime($tokenData['expiresAt']);
        $now = time();

        if ($expiresAt > $now) {
            // Токен еще действителен
            return $tokenData['token'];
        }
    }

    // Токен истек или отсутствует - получаем новый
    return getNewToken();
}

// Функция для получения нового токена
function getNewToken() {
    // Здесь вызываете get_token.php или отправляете GetToken запрос
    // Возвращаете новый токен
    return null; // Заглушка
}

// Пример использования для платежа
function makePayment($amount, $currency = '643') {
    $token = getValidToken();

    if (!$token) {
        return ['error' => 'Не удалось получить токен'];
    }

    $paymentData = [
        'credentials' => [
            'authorizationToken' => $token
        ],
        'operationData' => [
            'instrument' => 'CARD',
            'operationExternalId' => uniqid('pay_'),
            'amountData' => [
                'currencyCode' => $currency,
                'amount' => $amount,
                'amountExponent' => '2'
            ],
            'goods' => [
                'product' => [
                    [
                        'name' => 'Payment',
                        'price' => $amount,
                        'quantity' => '1',
                        'quantityExponent' => '0',
                        'taxRate' => 'TAX_20',
                        'accountingSubject' => 'PRODUCT'
                    ]
                ]
            ]
        ]
    ];

    // Отправляете запрос на платеж с тем же токеном
    return $paymentData;
}

// Примеры использования
echo "<h2>Примеры использования токена</h2>";

// Получаем токен (один раз)
$token = getValidToken();
echo "<p><strong>Токен:</strong> " . ($token ?: 'Не получен') . "</p>";

// Делаем несколько платежей с тем же токеном
$payment1 = makePayment('1000'); // 10.00 рублей
$payment2 = makePayment('2500'); // 25.00 рублей
$payment3 = makePayment('5000'); // 50.00 рублей

echo "<h3>Платеж 1:</h3>";
echo "<pre>" . json_encode($payment1, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";

echo "<h3>Платеж 2:</h3>";
echo "<pre>" . json_encode($payment2, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";

echo "<h3>Платеж 3:</h3>";
echo "<pre>" . json_encode($payment3, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";
?>