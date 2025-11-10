# Визуальная схема взаимодействия компонентов

## Общая архитектура системы

```mermaid
graph TB
    subgraph "Клиентская часть"
        User[👤 Пользователь]
        WebApp[🌐 Веб-приложение<br/>JavaScript<br/>app.js + index.html]
    end
    
    subgraph "Мобильное приложение"
        Flutter[📱 Flutter App<br/>InAppWebView<br/>Bridge Communication]
    end
    
    subgraph "Backend сервисы"
        BackendAPI[⚙️ Backend API<br/>cotroller.php<br/>PHP + Vtiger]
        TokenAPI[🔑 Token API<br/>get_token.php<br/>settoken.php]
        TerminalSettings[⚙️ Terminal Settings<br/>terminal_settings.php]
    end
    
    subgraph "Платежные системы"
        MegaPay[💳 MegaPay API<br/>GetToken<br/>core.megapay.pos.kg]
        Terminal[🏪 Терминал<br/>PayMob/MegaPay<br/>Физическое устройство]
        YandexKassa[💵 ЯКасса<br/>Платежный шлюз<br/>Опционально]
    end
    
    subgraph "База данных"
        VtigerDB[(🗄️ Vtiger CRM<br/>MySQL<br/>Users, Estates, Payments)]
        TokenStorage[(💾 Token Storage<br/>tokens.json<br/>Файловое хранилище)]
    end
    
    User -->|Взаимодействие| WebApp
    WebApp <-->|JavaScript Bridge| Flutter
    WebApp <-->|HTTP/JSON| BackendAPI
    WebApp <-->|HTTP/JSON| TokenAPI
    WebApp <-->|HTTP/JSON| TerminalSettings
    
    BackendAPI <-->|SQL Queries| VtigerDB
    TerminalSettings <-->|SQL Queries| VtigerDB
    
    TokenAPI <-->|HTTP/JSON| MegaPay
    MegaPay -->|Callback| TokenAPI
    TokenAPI -->|Save| TokenStorage
    
    Flutter <-->|SDK/API| Terminal
    Terminal <-->|Payment Processing| MegaPay
    
    style User fill:#e3f2fd
    style WebApp fill:#fff3e0
    style Flutter fill:#e8f5e9
    style BackendAPI fill:#f3e5f5
    style TokenAPI fill:#fff9c4
    style MegaPay fill:#e0f2f1
    style Terminal fill:#ffebee
    style YandexKassa fill:#fce4ec
    style VtigerDB fill:#e1bee7
    style TokenStorage fill:#b2dfdb
```

---

## Последовательность операций: Терминальный платеж (CARD)

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 Пользователь
    participant W as 🌐 Веб-приложение
    participant F as 📱 Flutter
    participant TS as ⚙️ Terminal Settings
    participant TA as 🔑 Token API
    participant MP as 💳 MegaPay API
    participant T as 🏪 Терминал
    participant BA as ⚙️ Backend API
    participant DB as 🗄️ Vtiger CRM
    
    U->>W: 1. Выбор абонента, услуги, суммы
    U->>W: 2. Нажатие "💳 Терминал"
    
    W->>F: 3. getSerialNumber()
    F->>W: 4. getSerialNumber("TERMINAL123")
    
    W->>TS: 5. getOperatorLogin("TERMINAL123")
    TS->>DB: 6. SELECT operator_login
    DB->>TS: 7. operator_login
    TS->>W: 8. operator_login
    
    W->>TA: 9. Запрос токена (serial_number)
    TA->>DB: 10. Проверка operator_login
    DB->>TA: 11. operator_login
    TA->>MP: 12. GetToken(operator_login)
    MP->>TA: 13. Callback: Token + Timeout
    TA->>TA: 14. Сохранение в tokens.json
    
    W->>TA: 15. get_token_status.php
    TA->>W: 16. Token (валидный)
    
    W->>F: 17. onPayment(CARD + token + данные)
    F->>T: 18. Обработка платежа через терминал
    T->>MP: 19. Авторизация транзакции
    MP->>T: 20. Подтверждение
    T->>F: 21. Результат + RNN
    
    F->>W: 22. createPaymentAfterFlutterConfirmation(RNN)
    
    W->>BA: 23. processPayment(данные + RNN)
    BA->>DB: 24. INSERT INTO Payments
    DB->>BA: 25. Payment ID
    BA->>W: 26. Успех (payment_id)
    
    W->>U: 27. ✅ Платеж успешно создан!
```

---

## Последовательность операций: Наличный платеж (CASH)

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 Пользователь
    participant W as 🌐 Веб-приложение
    participant F as 📱 Flutter
    participant BA as ⚙️ Backend API
    participant DB as 🗄️ Vtiger CRM
    
    U->>W: 1. Выбор абонента, услуги, суммы
    U->>W: 2. Нажатие "💵 Наличные"
    
    W->>F: 3. onPayment(CASH + данные)
    Note over F: Обработка наличного платежа<br/>без токена и терминала
    F->>W: 4. createPaymentAfterFlutterConfirmation(успех)
    
    W->>BA: 5. processPayment(данные, type=cash)
    BA->>DB: 6. INSERT INTO Payments
    DB->>BA: 7. Payment ID
    BA->>W: 8. Успех (payment_id)
    
    W->>U: 9. ✅ Платеж успешно создан!
```

---

## Последовательность операций: Авторизация

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 Пользователь
    participant W as 🌐 Веб-приложение
    participant CP as 🔐 checkPass.php
    participant BA as ⚙️ Backend API
    participant DB as 🗄️ Vtiger CRM
    
    U->>W: 1. Ввод логина и пароля
    W->>CP: 2. Проверка пароля (hash)
    CP->>W: 3. Хеш пароля
    
    W->>BA: 4. checkUser(username, hash)
    BA->>DB: 5. SELECT user FROM vtiger_users
    DB->>BA: 6. Данные пользователя
    
    alt Пользователь найден и активен
        BA->>W: 7. Успех (user_id, fullname)
        W->>BA: 8. addAuth/updateAuth(phoneIdentifier, user_id)
        BA->>DB: 9. INSERT/UPDATE bot_auth
        DB->>BA: 10. Успех
        BA->>W: 11. Авторизация сохранена
        W->>U: 12. ✅ Вход выполнен
    else Ошибка авторизации
        BA->>W: 7. Ошибка
        W->>U: 8. ❌ Неверный логин/пароль
    end
```

---

## Последовательность операций: Поиск абонентов

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 Пользователь
    participant W as 🌐 Веб-приложение
    participant BA as ⚙️ Backend API
    participant DB as 🗄️ Vtiger CRM
    
    U->>W: 1. Выбор МП, ввод ФИО/ЛС
    U->>W: 2. Нажатие "Найти"
    
    W->>BA: 3. searchSubscribers(mp_id, fio, account_number)
    BA->>DB: 4. SELECT FROM vtiger_estates<br/>WHERE mp_id AND fio LIKE AND account LIKE
    DB->>BA: 5. Результаты поиска (массив абонентов)
    
    BA->>W: 6. Успех (data: [...subscribers])
    W->>W: 7. Отображение результатов с пагинацией
    W->>U: 8. 📋 Список найденных абонентов
```

---

## Схема получения токена MegaPay

```mermaid
graph LR
    A[Веб-приложение<br/>Запрос токена] -->|1. serial_number| B[get_token.php]
    B -->|2. Проверка| C{operator_login<br/>в БД?}
    C -->|Нет| D[❌ Ошибка:<br/>operator_login не настроен]
    C -->|Да| E[3. Формирование запроса]
    E -->|4. HTTP POST| F[MegaPay API<br/>GetToken]
    F -->|5. Валидация| G{Валидные<br/>данные?}
    G -->|Нет| H[❌ Ошибка авторизации]
    G -->|Да| I[6. Генерация токена]
    I -->|7. Callback POST| J[settoken.php]
    J -->|8. Сохранение| K[tokens.json]
    K -->|9. Проверка статуса| L[get_token_status.php]
    L -->|10. Токен валиден| M[✅ Токен готов<br/>к использованию]
    
    style A fill:#fff3e0
    style B fill:#fff9c4
    style F fill:#e0f2f1
    style K fill:#b2dfdb
    style M fill:#c8e6c9
    style D fill:#ffcdd2
    style H fill:#ffcdd2
```

---

## Детальная схема компонентов

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          КЛИЕНТСКАЯ ЧАСТЬ                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    ВЕБ-ПРИЛОЖЕНИЕ (JavaScript)                       │    │
│  │                                                                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │    │
│  │  │ Авторизация   │  │ Поиск       │  │ Платежи                   │   │    │
│  │  │ - checkAuth   │  │ - search    │  │ - CASH (наличные)        │   │    │
│  │  │ - login       │  │ - services  │  │ - CARD (терминал)        │   │    │
│  │  │ - logout      │  │             │  │ - токены                  │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │    │
│  │                                                                       │    │
│  │  JavaScript Bridge: window.flutter_inappwebview                     │    │
│  │  - callHandler("getSerialNumber")                                    │    │
│  │  - callHandler("onPayment", data)                                    │    │
│  │  - callHandler("onMunicipalLogout")                                  │    │
│  │                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/JSON
                                    │ JavaScript Bridge
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│  FLUTTER APP  │         │  BACKEND API  │         │  TOKEN API     │
│               │         │               │         │               │
│ InAppWebView  │         │ cotroller.php │         │ get_token.php │
│               │         │               │         │ settoken.php  │
│ Handlers:     │         │ Actions:      │         │               │
│ - getSerial   │         │ - checkUser   │         │ Functions:    │
│   Number      │         │ - checkAuth   │         │ - GetToken    │
│ - onPayment   │         │ - search      │         │ - SaveToken   │
│ - onLogout    │         │ - payment     │         │ - CheckStatus │
│               │         │               │         │               │
└───────┬───────┘         └───────┬───────┘         └───────┬───────┘
        │                         │                         │
        │ SDK/API                 │ SQL                     │ HTTP/JSON
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│   ТЕРМИНАЛ    │         │  VTIGER CRM   │         │  MEGAPAY API   │
│               │         │               │         │               │
│ PayMob/MegaPay│         │ MySQL Database│         │ GetToken      │
│               │         │               │         │               │
│ Functions:    │         │ Tables:       │         │ Endpoint:     │
│ - Card Payment│         │ - vtiger_users│         │ core.megapay  │
│ - RNN Generate│         │ - vtiger_     │         │   .pos.kg     │
│ - Transaction │         │   estates     │         │               │
│   Result      │         │ - Payments    │         │ Callback:     │
│               │         │ - bot_auth    │         │ settoken.php  │
│               │         │ - terminal_   │         │               │
│               │         │   settings    │         │               │
└───────────────┘         └───────────────┘         └───────────────┘
        │                         │                         │
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                                  │ Payment Processing
                                  │
                          ┌───────▼───────┐
                          │   ЯКАССА      │
                          │  (Опционально)│
                          │               │
                          │ Платежный     │
                          │ шлюз          │
                          └───────────────┘
```

---

## Потоки данных

### Поток 1: Авторизация пользователя
```
[Пользователь]
    │
    │ Ввод логина/пароля
    ▼
[Веб-приложение]
    │
    │ HTTP POST: checkUser
    ▼
[Backend API]
    │
    │ SQL: SELECT FROM vtiger_users
    ▼
[Vtiger CRM]
    │
    │ Данные пользователя
    ▼
[Backend API]
    │
    │ SQL: INSERT INTO bot_auth
    ▼
[Vtiger CRM]
    │
    │ Успех авторизации
    ▼
[Веб-приложение]
    │
    │ Отображение интерфейса
    ▼
[Пользователь]
```

### Поток 2: Терминальный платеж
```
[Пользователь]
    │ Выбор абонента, услуги, суммы
    ▼
[Веб-приложение]
    │ getSerialNumber()
    ▼
[Flutter]
    │ serialNumber
    ▼
[Веб-приложение]
    │ Проверка operator_login
    ▼
[Backend API] → [Vtiger CRM]
    │ operator_login
    ▼
[Веб-приложение]
    │ Запрос токена
    ▼
[Token API] → [MegaPay API]
    │ Токен (callback)
    ▼
[Token API] → [tokens.json]
    │ Токен валиден
    ▼
[Веб-приложение]
    │ onPayment(CARD + token)
    ▼
[Flutter] → [Терминал] → [MegaPay]
    │ Результат + RNN
    ▼
[Flutter]
    │ createPaymentAfterFlutterConfirmation(RNN)
    ▼
[Веб-приложение]
    │ processPayment(данные + RNN)
    ▼
[Backend API] → [Vtiger CRM]
    │ Payment ID
    ▼
[Веб-приложение]
    │ Сообщение об успехе
    ▼
[Пользователь]
```

---

## Технические детали взаимодействия

### JavaScript ↔ Flutter

**Методы вызова Flutter из JavaScript:**
```javascript
// Получение серийного номера
window.flutter_inappwebview.callHandler("getSerialNumber");

// Отправка платежа
window.flutter_inappwebview.callHandler("onPayment", {
  action: "processPayment",
  ls: "12345",
  service_id: "1",
  amount: 1000.50,
  payment_type: "CARD",
  megapay_token: "token_here"
});

// Выход из МП
window.flutter_inappwebview.callHandler("onMunicipalLogout");
```

**Callbacks от Flutter в JavaScript:**
```javascript
// Получение серийного номера
window.getSerialNumber = function(serialNumber) {
  // Обработка
};

// Результат платежа
window.createPaymentAfterFlutterConfirmation = function(response) {
  // response.result.code === 0 - успех
  // response.transaction.instrumentSpecificData.rrn - RNN
};
```

### Веб-приложение ↔ Backend API

**Формат запроса:**
```json
POST /controllers/cotroller.php
Content-Type: application/json

{
  "action": "processPayment",
  "ls": "12345",
  "service_id": "1",
  "amount": 1000.50,
  "payment_type": "terminal",
  "rnn": "123456789012"
}
```

**Формат ответа:**
```json
{
  "success": true,
  "message": "Платёж успешно сохранён",
  "payment_id": "456"
}
```

### Backend API ↔ MegaPay

**Запрос токена:**
```json
POST https://core.megapay.pos.kg/json/GetToken
Content-Type: application/json

{
  "@MsgNum": "req_1234567890",
  "OpLogin": "operator@example.com",
  "SysLogin": "admin",
  "SysPwd": "hash_password",
  "Lang": "rus",
  "Info": "PHP Payment System v1.0"
}
```

**Callback от MegaPay:**
```json
POST /controllers/settoken.php
Content-Type: application/json

{
  "@MsgNum": "req_1234567890",
  "OpLogin": "operator@example.com",
  "Token": "abc123def456...",
  "TokenTimeout": 3600,
  "ServerTime": "15.01.2024 12:00:00 GMT+6"
}
```

---

## Ключевые моменты архитектуры

1. **Разделение ответственности:**
   - Веб-приложение: UI и бизнес-логика
   - Flutter: Коммуникация с терминалом
   - Backend: Работа с БД и внешними API
   - MegaPay: Авторизация и обработка платежей

2. **Асинхронность:**
   - Все взаимодействия асинхронные
   - Callbacks для обработки результатов
   - Ожидание токенов через polling

3. **Безопасность:**
   - Токены с ограниченным временем жизни
   - Валидация на сервере
   - Логирование всех операций

4. **Масштабируемость:**
   - Модульная архитектура
   - Легко добавить новые платежные системы
   - Централизованное управление токенами

---

**Версия схемы:** 1.0  
**Дата создания:** 2024-01-15

