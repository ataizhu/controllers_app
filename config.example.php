<?php
// Пример конфигурации для интеграции с MegaPay
// Скопируйте этот файл в config.php и заполните реальными данными
return [
    'megapay' => [
        'url' => 'https://core.megapay.pos.kg/json/GetToken',
        'callback_url' => 'https://your-domain.com/settoken.php', // Замените на ваш домен
        'operator_login' => 'your-operator@example.com', // Замените на ваш логин оператора
        'system_admin_login' => 'your-system-admin', // Замените на логин администратора
        'system_admin_password_hash' => 'your-password-hash', // Замените на хеш пароля администратора
        'language' => 'rus',
        'system_info' => 'PHP Payment System v1.0'
    ],
    'logging' => [
        'enabled' => true,
        'log_file' => 'token_requests.log'
    ]
];
?>