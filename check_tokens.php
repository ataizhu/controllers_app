<?php
echo "<h2>Проверка полученных токенов</h2>";

if (file_exists('tokens.json')) {
    $tokenData = json_decode(file_get_contents('tokens.json'), true);

    echo "<h3>Последний полученный токен:</h3>";
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Поле</th><th>Значение</th></tr>";

    foreach ($tokenData as $key => $value) {
        echo "<tr><td><strong>$key</strong></td><td>$value</td></tr>";
    }

    echo "</table>";

    // Проверяем, не истек ли токен
    $expiresAt = strtotime($tokenData['expiresAt']);
    $now = time();

    if ($expiresAt > $now) {
        $remaining = $expiresAt - $now;
        echo "<p style='color: green;'>✅ Токен действителен еще " . gmdate('H:i:s', $remaining) . "</p>";
    } else {
        echo "<p style='color: red;'>❌ Токен истек</p>";
    }
} else {
    echo "<p>Токены еще не получены</p>";
}

echo "<hr>";

// Показываем лог
if (file_exists('token_requests.log')) {
    echo "<h3>Лог запросов:</h3>";
    echo "<pre style='background: #f5f5f5; padding: 10px; max-height: 400px; overflow-y: scroll;'>";
    echo htmlspecialchars(file_get_contents('token_requests.log'));
    echo "</pre>";
} else {
    echo "<p>Лог файл не найден</p>";
}
?>