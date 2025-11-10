# Полная документация по сервису управления платежами

## 📋 Содержание

1. [Общее описание](#общее-описание)
2. [Архитектура системы](#архитектура-системы)
3. [API Endpoints](#api-endpoints)
4. [Типы данных](#типы-данных)
5. [Взаимодействие с Flutter](#взаимодействие-с-flutter)
6. [Создание платежей](#создание-платежей)
7. [Система токенов](#система-токенов)
8. [Настройки терминалов](#настройки-терминалов)
9. [Обработка ошибок](#обработка-ошибок)
10. [Примеры использования](#примеры-использования)

---

## Общее описание

Веб-сервис для управления абонентами муниципальных предприятий с поддержкой приема платежей через терминалы MegaPay. Система интегрирована с Flutter-приложением для обработки платежей и Vtiger CRM для хранения данных.

### Основные возможности:
- 🔐 Авторизация пользователей через Vtiger CRM
- 🔍 Поиск абонентов по лицевому счету, ФИО и муниципальному предприятию
- 💳 Прием платежей через терминал (карта) и наличными
- 🔑 Управление токенами авторизации MegaPay
- ⚙️ Настройка терминалов и операторов
- 📊 Логирование всех операций

---

## Архитектура системы

### Структура файлов:

```
controllers/
├── app.js                    # Основная логика фронтенда (1954 строки)
├── cotroller.php             # Универсальный API обработчик (500 строк)
├── terminal_settings.php     # Управление настройками терминалов
├── get_token.php             # Получение токенов от MegaPay
├── settoken.php              # Callback для сохранения токенов
├── get_token_status.php      # Проверка статуса токена
├── check_tokens.php          # Визуальная проверка токенов
├── config.php                # Конфигурация MegaPay
├── config.js                 # Конфигурация фронтенда
├── language.js               # Языковая система
├── index.html                # Интерфейс приложения
└── style.css                 # Стили приложения
```

### Компоненты системы:

1. **Frontend (JavaScript)**
   - Управление UI и пользовательскими взаимодействиями
   - Коммуникация с Flutter через `window.flutter_inappwebview`
   - Обработка платежей и отображение результатов

2. **Backend (PHP)**
   - API endpoints для всех операций
   - Интеграция с Vtiger CRM
   - Управление токенами MegaPay
   - Работа с базой данных

3. **Flutter Integration**
   - Получение серийного номера терминала
   - Обработка платежей через терминал
   - Возврат результатов платежей

---

## API Endpoints

### Базовый URL
```
POST /controllers/cotroller.php
```

Все запросы отправляются методом `POST` с телом в формате JSON.

### Формат запроса:
```json
{
  "action": "actionName",
  "param1": "value1",
  "param2": "value2"
}
```

### Формат ответа:
```json
{
  "success": true|false,
  "message": "Описание результата",
  "data": {} // Опционально
}
```

---

### 1. Авторизация

#### `checkUser` - Проверка пользователя

**Запрос:**
```json
{
  "action": "checkUser",
  "username": "user@example.com",
  "hashed_password": "hash_от_пароля"
}
```

**Ответ (успех):**
```json
{
  "success": true,
  "message": "Авторизация Vtiger прошла успешно!",
  "user_id": "1",
  "username": "user@example.com",
  "fullname": "Иван Иванов"
}
```

**Ответ (ошибка):**
```json
{
  "success": false,
  "message": "Неверный логин или пароль."
}
```

---

#### `checkAuth` - Проверка авторизации по идентификатору устройства

**Запрос:**
```json
{
  "action": "checkAuth",
  "phoneIdentifier": "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
}
```

**Ответ (авторизован):**
```json
{
  "success": true,
  "data": {
    "vtiger_user_id": "1",
    "username": "user@example.com",
    "expiration": "2024-01-15 12:00:00",
    "fullname": "Иван Иванов"
  }
}
```

**Ответ (не авторизован):**
```json
{
  "success": true,
  "data": "empty",
  "message": "Нет активной авторизации."
}
```

---

#### `addAuth` - Добавление новой авторизации

**Запрос:**
```json
{
  "action": "addAuth",
  "phoneIdentifier": "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",
  "vtiger_user_id": "1"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Новая авторизация добавлена."
}
```

**Примечание:** Авторизация действительна 7 дней с момента создания.

---

#### `updateAuth` - Обновление авторизации

**Запрос:**
```json
{
  "action": "updateAuth",
  "phoneIdentifier": "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",
  "vtiger_user_id": "1"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Авторизация обновлена."
}
```

**Примечание:** Продлевает срок действия авторизации на 7 дней.

---

#### `logout` - Выход из системы

**Запрос:**
```json
{
  "action": "logout",
  "phoneIdentifier": "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Пользователь успешно вышел из системы."
}
```

---

### 2. Поиск абонентов

#### `searchSubscribers` - Поиск абонентов

**Запрос:**
```json
{
  "action": "searchSubscribers",
  "mp_id": "1",
  "fio": "Иванов",           // Опционально
  "account_number": "12345"  // Опционально
}
```

**Ответ (успех):**
```json
{
  "success": true,
  "message": "Поиск завершен.",
  "data": [
    {
      "id": "123",
      "account_number": "12345",
      "full_name": "Иванов Иван Иванович",
      "locality": "Бишкек",
      "street": "ул. Чуй",
      "house": "123",
      "flat": "45",
      "address": "Бишкек, ул. Чуй, 123, кв. 45",
      "phone": "+996555123456",
      "balance": "-150.50"
    }
  ],
  "count": 1
}
```

**Параметры:**
- `mp_id` (обязательный) - ID муниципального предприятия
- `fio` (опциональный) - ФИО для поиска (частичное совпадение)
- `account_number` (опциональный) - Лицевой счет (частичное совпадение)

**Ограничения:**
- Максимум 500 результатов за запрос
- Результаты отсортированы по лицевому счету

---

#### `getServices` - Получение списка услуг

**Запрос:**
```json
{
  "action": "getServices"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Услуги получены.",
  "services": [
    {
      "id": "1",
      "name": "Водоснабжение"
    },
    {
      "id": "2",
      "name": "Электроснабжение"
    }
  ]
}
```

---

### 3. Платежи

#### `processPayment` - Создание платежа

**Запрос:**
```json
{
  "action": "processPayment",
  "ls": "12345",
  "service_id": "1",
  "service": "Водоснабжение",
  "amount": 1000.50,
  "payment_type": "cash|terminal",
  "date": "2024-01-15",
  "user_id": "1",
  "rnn": "123456789012"  // Опционально, только для terminal
}
```

**Ответ (успех):**
```json
{
  "success": true,
  "message": "Платёж успешно сохранён",
  "payment_id": "456"
}
```

**Ответ (ошибка):**
```json
{
  "success": false,
  "message": "Лицевой счёт не найден"
}
```

**Параметры:**
- `ls` (обязательный) - Лицевой счет абонента
- `service_id` (обязательный) - ID услуги
- `service` (обязательный) - Название услуги
- `amount` (обязательный) - Сумма платежа (float)
- `payment_type` (обязательный) - Тип платежа: `"cash"` или `"terminal"`
- `date` (обязательный) - Дата платежа в формате `YYYY-MM-DD`
- `user_id` (обязательный) - ID пользователя (контролера)
- `rnn` (опциональный) - RNN от терминала MegaPay (только для `terminal`)

**Типы платежей:**
- `cash` - Наличный платеж, создается сразу
- `terminal` - Платеж через терминал, требует RNN от MegaPay

---

#### `logPayment` - Запись лога платежа

**Запрос:**
```json
{
  "action": "logPayment",
  "message": "Платеж создан | LS: 12345 | Amount: 1000.50"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Лог записан"
}
```

**Примечание:** Логи записываются в файл `payments.log`.

---

## Типы данных

### Объект абонента (Subscriber)

```typescript
interface Subscriber {
  id: string;                    // ID записи в Vtiger
  account_number: string;        // Лицевой счет
  full_name: string;             // ФИО абонента
  locality: string;              // Населенный пункт
  street: string;                // Улица
  house: string;                 // Номер дома
  flat: string;                  // Номер квартиры
  address: string;               // Полный адрес
  phone: string;                 // Телефон
  balance: string;                // Баланс (может быть отрицательным)
}
```

### Объект услуги (Service)

```typescript
interface Service {
  id: string;                    // ID услуги
  name: string;                  // Название услуги
}
```

### Объект платежа (Payment)

```typescript
interface Payment {
  ls: string;                     // Лицевой счет
  service_id: string;            // ID услуги
  service: string;               // Название услуги
  amount: number;                // Сумма платежа
  payment_type: "cash" | "terminal";  // Тип платежа
  date: string;                   // Дата в формате YYYY-MM-DD
  user_id: string;               // ID пользователя
  rnn?: string;                  // RNN от терминала (опционально)
  megapay_token?: string;        // Токен MegaPay (для терминальных платежей)
  vat_value?: number;            // НДС (12.00)
  st_value?: number;             // НСП (2.00)
  controllerName?: string;       // Имя контролера
}
```

### Объект токена (Token)

```typescript
interface Token {
  msgNum: string;                 // Номер сообщения
  opLogin: string;                // Логин оператора
  token: string;                  // Токен авторизации
  tokenTimeout: number;           // Время жизни токена (секунды)
  serverTime: string;             // Время сервера MegaPay
  receivedAt: string;             // Время получения токена
  expiresAt: string;             // Время истечения токена
}
```

### Объект ответа от терминала (Terminal Response)

```typescript
interface TerminalResponse {
  result?: {
    code: number;                 // Код результата (0 = успех)
    description?: string;         // Описание результата
    RNN?: string;                 // RNN транзакции (старый формат)
  };
  transaction?: {
    instrumentSpecificData?: {
      rrn?: string;               // RNN транзакции (новый формат)
    };
  };
  error?: string;                 // Текст ошибки
  errorCode?: number;             // Код ошибки
  message?: string;               // Сообщение об ошибке
}
```

---

## Взаимодействие с Flutter

### JavaScript → Flutter

#### 1. Получение серийного номера терминала

```javascript
if (window.flutter_inappwebview) {
  window.flutter_inappwebview.callHandler("getSerialNumber");
}
```

**Ожидаемый ответ:** Flutter вызывает `window.getSerialNumber(serialNumber)`

---

#### 2. Отправка платежа в Flutter

```javascript
const paymentData = {
  action: "processPayment",
  ls: "12345",
  service_id: "1",
  service: "Водоснабжение",
  amount: 1000.50,
  payment_type: "CARD",  // или "CASH"
  date: "2024-01-15",
  controllerName: "Иван Иванов",
  user_id: "1",
  megapay_token: "token_here",  // Только для CARD
  vat_value: 12.00,
  st_value: 2.00
};

window.flutter_inappwebview.callHandler("onPayment", paymentData);
```

**Типы платежей для Flutter:**
- `CARD` - Платеж через терминал (требует `megapay_token`)
- `CASH` - Наличный платеж (не требует токен)

---

#### 3. Уведомление о выходе из муниципального предприятия

```javascript
if (window.flutter_inappwebview) {
  window.flutter_inappwebview.callHandler("onMunicipalLogout");
}
```

---

### Flutter → JavaScript

#### 1. Передача серийного номера терминала

```dart
webViewController.evaluateJavascript(
  'window.getSerialNumber("$serialNumber")'
);
```

**Или альтернативное имя функции:**
```dart
webViewController.evaluateJavascript(
  'window.getTerminalSerialNumber("$serialNumber")'
);
```

---

#### 2. Возврат результата платежа

**Успешный платеж:**
```dart
final responseData = {
  'result': {
    'code': 0,
    'description': 'Payment successful',
    'RNN': '123456789012'  // RNN от терминала
  },
  // Или новый формат:
  'transaction': {
    'instrumentSpecificData': {
      'rrn': '123456789012'
    }
  }
};

webViewController.evaluateJavascript(
  'window.createPaymentAfterFlutterConfirmation(${jsonEncode(responseData)})'
);
```

**Ошибка платежа:**
```dart
final errorData = {
  'error': 'Payment failed',
  'errorCode': 1,
  'message': 'Insufficient funds'
};

webViewController.evaluateJavascript(
  'window.createPaymentAfterFlutterConfirmation(${jsonEncode(errorData)})'
);
```

---

### Полный пример интеграции Flutter

```dart
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class PaymentWebView extends StatefulWidget {
  @override
  _PaymentWebViewState createState() => _PaymentWebViewState();
}

class _PaymentWebViewState extends State<PaymentWebView> {
  InAppWebViewController? webViewController;

  @override
  Widget build(BuildContext context) {
    return InAppWebView(
      initialUrlRequest: URLRequest(
        url: WebUri("https://your-domain.com/controllers/index.html")
      ),
      onWebViewCreated: (controller) {
        webViewController = controller;
      },
      onLoadStop: (controller, url) {
        // Регистрируем обработчики после загрузки страницы
        setupJavaScriptHandlers();
      },
    );
  }

  void setupJavaScriptHandlers() {
    // Обработчик получения серийного номера
    webViewController?.addJavaScriptHandler(
      handlerName: "getSerialNumber",
      callback: (args) async {
        final serialNumber = await getTerminalSerialNumber();
        webViewController?.evaluateJavascript(
          source: 'window.getSerialNumber("$serialNumber")'
        );
      }
    );

    // Обработчик платежа
    webViewController?.addJavaScriptHandler(
      handlerName: "onPayment",
      callback: (args) async {
        if (args.isNotEmpty) {
          final paymentData = args[0] as Map<String, dynamic>;
          await processPayment(paymentData);
        }
      }
    );

    // Обработчик выхода
    webViewController?.addJavaScriptHandler(
      handlerName: "onMunicipalLogout",
      callback: (args) async {
        await performMunicipalLogout();
      }
    );
  }

  Future<String> getTerminalSerialNumber() async {
    // Получаем серийный номер терминала
    // Например, из настроек устройства или API
    return "TERMINAL123456";
  }

  Future<void> processPayment(Map<String, dynamic> paymentData) async {
    try {
      final paymentType = paymentData['payment_type'] as String;
      
      if (paymentType == 'CARD') {
        // Обработка платежа через терминал
        final result = await processCardPayment(paymentData);
        
        // Отправляем результат обратно в JavaScript
        webViewController?.evaluateJavascript(
          source: 'window.createPaymentAfterFlutterConfirmation(${jsonEncode(result)})'
        );
      } else if (paymentType == 'CASH') {
        // Обработка наличного платежа
        final result = await processCashPayment(paymentData);
        
        webViewController?.evaluateJavascript(
          source: 'window.createPaymentAfterFlutterConfirmation(${jsonEncode(result)})'
        );
      }
    } catch (e) {
      // Отправляем ошибку
      final errorData = {
        'error': e.toString(),
        'errorCode': 1,
        'message': 'Payment processing failed'
      };
      
      webViewController?.evaluateJavascript(
        source: 'window.createPaymentAfterFlutterConfirmation(${jsonEncode(errorData)})'
      );
    }
  }

  Future<Map<String, dynamic>> processCardPayment(Map<String, dynamic> data) async {
    // Интеграция с платежным терминалом
    // Возвращаем результат в формате:
    return {
      'result': {
        'code': 0,
        'description': 'Payment successful',
        'RNN': '123456789012'
      }
    };
  }

  Future<Map<String, dynamic>> processCashPayment(Map<String, dynamic> data) async {
    // Обработка наличного платежа
    return {
      'result': {
        'code': 0,
        'description': 'Cash payment recorded'
      }
    };
  }

  Future<void> performMunicipalLogout() async {
    // Выполняем полный выход из системы
  }
}
```

---

## Создание платежей

### Процесс создания платежа

#### 1. Наличный платеж (CASH)

```
1. Пользователь выбирает абонента
2. Выбирает услугу и вводит сумму
3. Нажимает кнопку "💵 Наличные"
4. JavaScript отправляет данные в Flutter через onPayment
5. Flutter обрабатывает платеж
6. Flutter возвращает результат через createPaymentAfterFlutterConfirmation
7. JavaScript создает платеж через processPayment API
8. Показывается сообщение об успехе
```

**Особенности:**
- Не требует токен MegaPay
- Не требует серийный номер терминала
- Создается сразу после подтверждения от Flutter

---

#### 2. Терминальный платеж (CARD)

```
1. Пользователь выбирает абонента
2. Выбирает услугу и вводит сумму
3. Нажимает кнопку "💳 Терминал"
4. JavaScript запрашивает серийный номер у Flutter (getSerialNumber)
5. Flutter возвращает серийный номер (getSerialNumber callback)
6. JavaScript проверяет operator_login в БД по серийному номеру
7. JavaScript запрашивает токен MegaPay (get_token.php)
8. JavaScript получает токен (get_token_status.php)
9. JavaScript отправляет данные платежа + токен в Flutter (onPayment)
10. Flutter обрабатывает платеж через терминал
11. Flutter возвращает результат + RNN (createPaymentAfterFlutterConfirmation)
12. JavaScript создает платеж через processPayment API с RNN
13. Показывается сообщение об успехе
```

**Особенности:**
- Требует серийный номер терминала
- Требует настроенный operator_login для терминала
- Требует валидный токен MegaPay
- Требует RNN от терминала для сохранения

---

### Структура данных платежа для Flutter

```javascript
{
  action: "processPayment",
  ls: "12345",                    // Лицевой счет
  service_id: "1",                // ID услуги
  service: "Водоснабжение",       // Название услуги
  amount: 1000.50,                // Сумма платежа
  payment_type: "CARD",           // CARD или CASH
  date: "2024-01-15",             // Дата платежа
  controllerName: "Иван Иванов",  // Имя контролера
  user_id: "1",                   // ID пользователя
  megapay_token: "token_here",   // Токен (только для CARD)
  vat_value: 12.00,               // НДС
  st_value: 2.00                  // НСП
}
```

---

### Обработка ответа от терминала

JavaScript ожидает один из следующих форматов:

**Формат 1 (новый):**
```json
{
  "transaction": {
    "instrumentSpecificData": {
      "rrn": "123456789012"
    }
  },
  "result": {
    "code": 0
  }
}
```

**Формат 2 (старый):**
```json
{
  "result": {
    "code": 0,
    "RNN": "123456789012"
  }
}
```

**Формат ошибки:**
```json
{
  "error": "Payment failed",
  "errorCode": 1,
  "message": "Insufficient funds"
}
```

---

## Система токенов

### Получение токена MegaPay

#### Endpoint: `get_token.php`

**Запрос:**
```json
{
  "serial_number": "TERMINAL123456"
}
```

**Ответ (успех):**
```json
{
  "success": true,
  "httpCode": 200,
  "response": {
    "@MsgNum": "req_1234567890",
    "OpLogin": "operator@example.com",
    "Token": "abc123def456...",
    "TokenTimeout": 3600,
    "ServerTime": "15.01.2024 12:00:00 GMT+6"
  },
  "operator_login_used": "operator@example.com"
}
```

**Ответ (ошибка):**
```json
{
  "success": false,
  "error": "Для данного терминала не настроен operator_login",
  "message": "Для данного терминала не настроен operator_login..."
}
```

**Процесс:**
1. Получает `serial_number` из запроса
2. Ищет `operator_login` в таблице `terminal_settings` по серийному номеру
3. Отправляет запрос в MegaPay API с `operator_login`
4. MegaPay отправляет токен на callback URL (`settoken.php`)
5. Токен сохраняется в `tokens.json`

---

### Callback для сохранения токена

#### Endpoint: `settoken.php`

**Запрос от MegaPay:**
```json
{
  "@MsgNum": "req_1234567890",
  "OpLogin": "operator@example.com",
  "Token": "abc123def456...",
  "TokenTimeout": 3600,
  "ServerTime": "15.01.2024 12:00:00 GMT+6"
}
```

**Ответ:**
```json
{
  "@MsgNum": "req_1234567890",
  "ServerTime": "15.01.2024 12:00:00 GMT+6",
  "Response": {
    "Code": "00",
    "Description": "OK",
    "Info": "Token successfully received and stored"
  }
}
```

**Процесс:**
1. Получает токен от MegaPay
2. Сохраняет в `tokens.json` с расчетом времени истечения
3. Возвращает подтверждение MegaPay

---

### Проверка статуса токена

#### Endpoint: `get_token_status.php`

**Запрос:** `GET /get_token_status.php`

**Ответ (валидный токен):**
```json
{
  "success": true,
  "token": "abc123def456...",
  "expiresAt": "2024-01-15 13:00:00",
  "isExpired": false,
  "opLogin": "operator@example.com",
  "receivedAt": "2024-01-15 12:00:00",
  "timeLeft": 3500
}
```

**Ответ (истекший токен):**
```json
{
  "success": true,
  "token": "abc123def456...",
  "expiresAt": "2024-01-15 12:00:00",
  "isExpired": true,
  "opLogin": "operator@example.com",
  "receivedAt": "2024-01-15 11:00:00",
  "timeLeft": 0
}
```

**Примечание:** Токен считается истекшим за 30 секунд до фактического истечения (запас времени).

---

### Структура файла tokens.json

```json
{
  "msgNum": "req_1234567890",
  "opLogin": "operator@example.com",
  "token": "abc123def456...",
  "tokenTimeout": 3600,
  "serverTime": "15.01.2024 12:00:00 GMT+6",
  "receivedAt": "2024-01-15 12:00:00",
  "expiresAt": "2024-01-15 13:00:00"
}
```

---

## Настройки терминалов

### Управление настройками терминалов

#### Endpoint: `terminal_settings.php`

### Получение operator_login

**Запрос:**
```json
{
  "action": "getOperatorLogin",
  "serial_number": "TERMINAL123456"
}
```

**Ответ (найден):**
```json
{
  "success": true,
  "operator_login": "operator@example.com"
}
```

**Ответ (не найден):**
```json
{
  "success": false,
  "message": "Оператор не найден для данного терминала",
  "operator_login": null
}
```

---

### Сохранение operator_login

**Запрос:**
```json
{
  "action": "saveOperatorLogin",
  "serial_number": "TERMINAL123456",
  "operator_login": "operator@example.com"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Настройки терминала сохранены"
}
```

**Примечание:** Если запись существует, она обновляется. Если нет - создается новая.

---

### Структура таблицы terminal_settings

```sql
CREATE TABLE terminal_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serial_number VARCHAR(255) UNIQUE NOT NULL,
  operator_login VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

### Процесс настройки терминала

```
1. Пользователь нажимает кнопку "Настройки терминала"
2. JavaScript запрашивает серийный номер у Flutter (getSerialNumber)
3. Flutter возвращает серийный номер
4. JavaScript загружает operator_login из БД (getOperatorLogin)
5. Если operator_login не найден - показывается форма ввода
6. Пользователь вводит operator_login (email)
7. JavaScript сохраняет настройки (saveOperatorLogin)
8. Настройки сохраняются в БД
```

---

## Обработка ошибок

### Типы ошибок

#### 1. Ошибки авторизации

**Неверный логин/пароль:**
```json
{
  "success": false,
  "message": "Неверный логин или пароль."
}
```

**Пользователь неактивен:**
```json
{
  "success": false,
  "message": "Ваша учетная запись неактивна."
}
```

**Сессия истекла:**
```json
{
  "success": true,
  "data": "empty",
  "message": "Сессия истекла или пользователь неактивен."
}
```

---

#### 2. Ошибки поиска

**Не выбрано МП:**
```json
{
  "success": false,
  "message": "Не выбрано Муниципальное предприятие"
}
```

**SQL ошибка:**
```json
{
  "success": false,
  "message": "SQL ошибка при поиске: [описание ошибки]"
}
```

---

#### 3. Ошибки платежей

**Неверные данные:**
```json
{
  "success": false,
  "message": "Неверные или отсутствующие данные для платежа."
}
```

**Лицевой счет не найден:**
```json
{
  "success": false,
  "message": "Лицевой счёт не найден"
}
```

**Неизвестный тип платежа:**
```json
{
  "success": false,
  "message": "Неизвестный тип платежа: [тип]"
}
```

---

#### 4. Ошибки токенов

**Серийный номер не передан:**
```json
{
  "success": false,
  "error": "Серийный номер терминала не передан",
  "message": "Серийный номер терминала не передан..."
}
```

**Operator login не настроен:**
```json
{
  "success": false,
  "error": "Для данного терминала не настроен operator_login",
  "message": "Для данного терминала не настроен operator_login..."
}
```

**Токен истек:**
```json
{
  "success": true,
  "isExpired": true,
  "timeLeft": 0
}
```

---

### Обработка ошибок в JavaScript

```javascript
// Пример обработки ошибок при создании платежа
try {
  const response = await fetch(BASE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "processPayment",
      // ... данные платежа
    })
  });

  const data = await response.json();

  if (data.success) {
    // Успех
    showPaymentSuccess("Платеж успешно создан!");
  } else {
    // Ошибка от сервера
    showPaymentError(data.message || "Ошибка создания платежа");
  }
} catch (error) {
  // Ошибка сети
  showPaymentError("Ошибка сети: " + error.message);
}
```

---

## Примеры использования

### Пример 1: Полный цикл наличного платежа

```javascript
// 1. Пользователь выбрал абонента и услугу
const paymentData = {
  action: "processPayment",
  ls: "12345",
  service_id: "1",
  service: "Водоснабжение",
  amount: 1000.50,
  payment_type: "CASH",
  date: "2024-01-15",
  controllerName: "Иван Иванов",
  user_id: "1"
};

// 2. Отправляем в Flutter
window.flutter_inappwebview.callHandler("onPayment", paymentData);

// 3. Flutter обрабатывает и возвращает результат
// window.createPaymentAfterFlutterConfirmation вызывается автоматически

// 4. В обработчике createPaymentAfterFlutterConfirmation:
function createPaymentAfterFlutterConfirmation(response) {
  if (response.result && response.result.code === 0) {
    // 5. Создаем платеж в системе
    fetch(BASE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "processPayment",
        ls: paymentData.ls,
        service_id: paymentData.service_id,
        service: paymentData.service,
        amount: paymentData.amount,
        payment_type: "cash",
        date: paymentData.date,
        user_id: paymentData.user_id
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showPaymentSuccess("Платеж успешно создан!");
      }
    });
  }
}
```

---

### Пример 2: Полный цикл терминального платежа

```javascript
// 1. Пользователь выбрал абонента и услугу, нажал "Терминал"
// 2. Запрашиваем серийный номер
window.flutter_inappwebview.callHandler("getSerialNumber");

// 3. Получаем серийный номер (в window.getSerialNumber)
function getSerialNumber(serialNumber) {
  terminalSerialNumber = serialNumber;
  
  // 4. Проверяем operator_login
  getOperatorLoginFromDB(serialNumber)
    .then(function(login) {
      if (!login) {
        showAlert("Настройте operator_login для терминала");
        return;
      }
      
      operatorLogin = login;
      
      // 5. Запрашиваем токен
      return getValidToken();
    })
    .then(function(token) {
      // 6. Подготавливаем данные платежа
      const paymentData = {
        action: "processPayment",
        ls: "12345",
        service_id: "1",
        service: "Водоснабжение",
        amount: 1000.50,
        payment_type: "CARD",
        date: "2024-01-15",
        controllerName: "Иван Иванов",
        user_id: "1",
        megapay_token: token
      };
      
      // 7. Отправляем в Flutter
      sendPaymentToFlutter(paymentData, button, details, "CARD");
    });
}

// 8. Flutter обрабатывает платеж и возвращает результат с RNN
// window.createPaymentAfterFlutterConfirmation вызывается автоматически

// 9. В обработчике:
function createPaymentAfterFlutterConfirmation(response) {
  // Извлекаем RNN
  let rnn = null;
  if (response.transaction?.instrumentSpecificData?.rrn) {
    rnn = response.transaction.instrumentSpecificData.rrn;
  } else if (response.result?.RNN) {
    rnn = response.result.RNN;
  }
  
  // 10. Создаем платеж с RNN
  fetch(BASE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "processPayment",
      ls: paymentData.ls,
      service_id: paymentData.service_id,
      service: paymentData.service,
      amount: paymentData.amount,
      payment_type: "terminal",
      date: paymentData.date,
      user_id: paymentData.user_id,
      rnn: rnn
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showPaymentSuccess("Платеж успешно создан!");
    }
  });
}
```

---

### Пример 3: Поиск абонентов

```javascript
// Запрос поиска
fetch(BASE_API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "searchSubscribers",
    mp_id: "1",
    fio: "Иванов",
    account_number: ""
  })
})
.then(response => response.json())
.then(data => {
  if (data.success && data.data.length > 0) {
    // Обработка результатов
    data.data.forEach(subscriber => {
      console.log(`Абонент: ${subscriber.full_name}, ЛС: ${subscriber.account_number}`);
    });
  }
});
```

---

### Пример 4: Получение услуг

```javascript
fetch(BASE_API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "getServices"
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    data.services.forEach(service => {
      console.log(`Услуга: ${service.name} (ID: ${service.id})`);
    });
  }
});
```

---

## Конфигурация

### config.php (MegaPay)

```php
<?php
return [
    'megapay' => [
        'url' => 'https://core.megapay.pos.kg/json/GetToken',
        'callback_url' => 'https://your-domain.com/controllers/settoken.php',
        'operator_login' => 'default@example.com',  // По умолчанию
        'system_admin_login' => 'admin',
        'system_admin_password_hash' => 'hash_here',
        'language' => 'rus',
        'system_info' => 'PHP Payment System v1.0'
    ],
    'logging' => [
        'enabled' => true,
        'log_file' => 'token_requests.log'
    ]
];
?>
```

### config.js (Frontend)

```javascript
const CONFIG = {
    BASE_API_URL: "https://your-domain.com/controllers/cotroller.php",
    CHECK_PASS_URL: "../checkPass.php",
    ITEMS_PER_PAGE: 10,
    MODAL_Z_INDEX: 10001,
    KEYBOARD_HIDE_DELAY: 200,
    MODAL_SHOW_DELAY: 100
};

window.CONFIG = CONFIG;
```

---

## Логирование

### Файлы логов

1. **payments.log** - Логи всех платежей
   - Формат: `[YYYY-MM-DD HH:MM:SS] Сообщение`
   - Пример: `[2024-01-15 12:00:00] ✅ Платеж успешно создан | PaymentID: 456 | LS: 12345 | Amount: 1000.50`

2. **token_requests.log** - Логи запросов токенов
   - Формат: `[YYYY-MM-DD HH:MM:SS] JSON данные`
   - Пример: `[2024-01-15 12:00:00] {"type":"request","data":{...}}`

3. **controller_error.log** - Ошибки контроллера
   - Автоматическое логирование всех ошибок PHP

---

## Безопасность

### Рекомендации

1. **HTTPS:** Все запросы должны идти через HTTPS
2. **Валидация:** Все данные должны валидироваться на сервере
3. **Токены:** Токены MegaPay хранятся в файле, рекомендуется использовать БД
4. **Пароли:** Пароли передаются только в хешированном виде
5. **CORS:** Настроены заголовки CORS для безопасности
6. **SQL Injection:** Используются подготовленные запросы (prepared statements)

---

## Часто задаваемые вопросы

### Q: Как получить токен для терминального платежа?

A: Токен запрашивается автоматически при создании терминального платежа. Процесс:
1. Получается серийный номер терминала
2. Проверяется operator_login в БД
3. Отправляется запрос в MegaPay API
4. Токен сохраняется через callback

### Q: Что делать, если токен истек?

A: Система автоматически запрашивает новый токен при каждом терминальном платеже.

### Q: Как настроить operator_login для терминала?

A: Через кнопку "Настройки терминала" в интерфейсе или через API `terminal_settings.php`.

### Q: В чем разница между CASH и CARD платежами?

A: 
- **CASH:** Наличный платеж, не требует токен, создается сразу
- **CARD:** Платеж через терминал, требует токен и RNN, создается после подтверждения от терминала

### Q: Как получить RNN от терминала?

A: RNN приходит в ответе от Flutter после успешного платежа. Может быть в двух форматах:
- `response.transaction.instrumentSpecificData.rrn` (новый)
- `response.result.RNN` (старый)

---

## Поддержка

При возникновении проблем проверьте:
1. Логи в `payments.log` и `token_requests.log`
2. Консоль браузера (F12)
3. Логи PHP в `controller_error.log`
4. Статус токена через `get_token_status.php`

---

**Версия документации:** 1.0  
**Дата обновления:** 2024-01-15

