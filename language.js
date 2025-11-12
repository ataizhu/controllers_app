// language.js - Система языков и переводов

// Текущий язык приложения
let currentLanguage = localStorage.getItem("appLanguage") || "ky";

// Словарь переводов
const translations = {
    ru: {
        login_heading: "Вход",
        login_label: "Логин:",
        password_label: "Пароль:",
        login_button: "Войти",
        login_error_id_not_defined: "Ошибка: Идентификатор устройства не определён.",
        login_error_auth_check: "Произошла ошибка при проверке авторизации. Проверьте подключение к сети.",
        login_success: "Авторизация успешна!",
        login_error_auth_failed: "Ошибка авторизации Vtiger. Проверьте логин/пароль.",
        login_error_hash_failed: "Ошибка получения хеша пароля.",
        login_error_critical: "Произошла неожиданная ошибка. Пожалуйста, проверьте подключение к интернету или попробуйте позже.",
        logout_confirm_message: "Вы действительно хотите выйти из системы?",
        logout_success: "Вы успешно вышли из системы.",
        logout_error: "Ошибка при выходе из системы.",
        logout_error_network: "Произошла неожиданная ошибка при выходе. Проверьте подключение к сети.",
        municipal_logout_button: "Выйти из муниципального предприятия",
        municipal_logout_confirm_message: "Вы действительно хотите выйти из муниципального предприятия?",
        // Модальные окна ожидания
        payment_waiting_title: "Ожидание оплаты",
        payment_waiting_status: "Ожидание подтверждения от терминала...",
        payment_waiting_cancel: "Отменить",
        payment_waiting_button: "Ожидание...",
        payment_processing_button: "Обработка...",
        payment_confirm_question: "Подтвердите проведение оплаты",
        payment_confirm_fio: "ФИО",
        payment_confirm_service: "Услуга",
        payment_confirm_amount: "Сумма",
        payment_confirm_currency: "сом",
        payment_confirm_confirm: "Подтвердить",
        payment_confirm_cancel: "Отмена",
        // Сообщения об успехе и ошибках
        payment_terminal_success: "✅ Платеж успешно создан после подтверждения терминала",
        payment_cancelled: "❌ Платеж отменен",
        payment_terminal_error: "❌ Ошибка терминала: ",
        payment_flutter_error: "❌ Ошибка: Flutter не доступен",
        payment_network_error: "❌ Ошибка при оплате. Проверьте подключение к интернету.",
        payment_success_message: "✅ Платеж успешно создан",
        payment_error_message: "❌ Ошибка при создании платежа",
        // Валидация
        validation_select_service: "Выберите услугу",
        validation_enter_amount: "Введите корректную сумму",
        // Заглушки данных
        data_not_available: "Н/Д",
        data_unknown: "Неизвестно",
        // Названия языков
        language_russian: "Русский",
        language_kyrgyz: "Кыргызча",
        language_english: "English",
        search_heading: "Поиск абонента",
        search_address_title: "Поиск по адресу",
        search_by_subscriber_data_title: "Поиск по данным абонента",
        loading_text: "Загрузка...",
        welcome_message: "Добро пожаловать,",
        // search_message_performing_search убрано
        search_message_no_subscribers_found: "По вашему запросу абоненты не найдены.",
        search_message_error: "Ошибка при выполнении поиска.",
        search_message_network_error: "Произошла ошибка сети при поиске. Проверьте подключение к интернету.",
        search_message_select_mp: "Пожалуйста, выберите Муниципальное предприятие.",
        results_heading: "Результаты",
        results_count_found: "найдено",
        results_message_no_subscribers: "Нет абонентов для отображения.",
        back_to_search_button: "← Назад к поиску",
        pagination_page_info: "Страница {current} из {total}",
        pagination_prev: "Предыдущая",
        pagination_next: "Следующая",
        ls_label: "Лицевой счет:",
        fio_label: "ФИО:",
        locality_label: "Населенный пункт:",
        street_label: "Улица:",
        house_label: "Дом:",
        flat_label: "Квартира:",
        balance_label: "Баланс:",
        debt_label: "Задолженность:",
        overpayment_label: "Переплата:",
        mp_label: "Муниципальное предприятие:",
        select_service: "Выберите услугу",
        enter_amount: "Введите сумму для оплаты",
        accept_payment_button_cash: "Принять оплату (Наличные)",
        accept_payment_button_terminal: "Принять оплату (Терминал)",
        payment_success: "Платеж успешно обработан.",
        payment_error: "Ошибка при обработке платежа.",
        payment_error_network: "Ошибка сети при обработке платежа.",
        payment_error_invalid_data: "Неверные данные для платежа.",
        search_mp_placeholder: "Выберите Муниципальное предприятие",
        search_account_placeholder: "Введите номер лицевого счета",
        search_fio_placeholder: "Введите ФИО (полностью или часть)",
        search_button: "Найти",
        logout_button: "Выйти из системы",
    },
    ky: {
        login_heading: "Кирүү",
        login_label: "Колдонуучу аты:",
        password_label: "Сырсөз:",
        login_button: "Кирүү",
        login_error_id_not_defined: "Ката: Түзмөктүн идентификатору аныкталган жок.",
        login_error_auth_check: "Авторизацияны текшерүүдө ката кетти. Тармакка туташууңузду текшериңиз.",
        login_success: "Авторизация ийгиликтүү өттү!",
        login_error_auth_failed: "Vtiger авторизация катасы. Колдонуучу атыңызды/сырсөзүңүздү текшериңиз.",
        login_error_hash_failed: "Сырсөздүн хешин алууда ката.",
        login_error_critical: "Күтүлбөгөн ката кетти. Интернет байланышыңызды текшериңиз же кийинчерээк кайталап көрүңүз.",
        logout_confirm_message: "Сиз чынында эле системадан чыккыңыз келеби?",
        logout_success: "Сиз ийгиликтүү чыктыңыз.",
        logout_error: "Системадан чыгууда ката кетти.",
        logout_error_network: "Системадан чыгууда күтүлбөгөн ката кетти. Тармакка туташууңузду текшериңиз.",
        municipal_logout_button: "Муниципалдык ишканадан чыгуу",
        municipal_logout_confirm_message: "Сиз чынында эле муниципалдык ишканадан чыккыңыз келеби?",
        // Модальные окна ожидания
        payment_waiting_title: "Төлөмдү күтүү",
        payment_waiting_status: "Терминалдын ырастоосун күтүү...",
        payment_waiting_cancel: "Жокко чыгаруу",
        payment_waiting_button: "Күтүү...",
        payment_processing_button: "Иштетүү...",
        payment_confirm_question: "Төлөмдү жүргүзүүнү ырастаңыз",
        payment_confirm_fio: "Аты-жөнү",
        payment_confirm_service: "Кызмат",
        payment_confirm_amount: "Сумма",
        payment_confirm_currency: "сом",
        payment_confirm_confirm: "Ырастоо",
        payment_confirm_cancel: "Жокко чыгаруу",
        // Сообщения об успехе и ошибках
        payment_terminal_success: "✅ Терминалдын ырастоосунан кийин төлөм ийгиликтүү түзүлдү",
        payment_cancelled: "❌ Төлөм жокко чыгарылды",
        payment_terminal_error: "❌ Терминал катасы: ",
        payment_flutter_error: "❌ Ката: Flutter жеткиликтүү эмес",
        payment_network_error: "❌ Төлөмдө ката. Интернет байланышыңызды текшериңиз.",
        payment_success_message: "✅ Төлөм ийгиликтүү түзүлдү",
        payment_error_message: "❌ Төлөм түзүүдө ката",
        // Валидация
        validation_select_service: "Кызматты тандаңыз",
        validation_enter_amount: "Туура сумманы киргизиңиз",
        // Заглушки данных
        data_not_available: "Ж/Д",
        data_unknown: "Белгисиз",
        // Названия языков
        language_russian: "Русский",
        language_kyrgyz: "Кыргызча",
        language_english: "English",
        search_heading: "Абонентти издөө",
        search_address_title: "Дареги боюнча издөө",
        search_by_subscriber_data_title: "Абонентти издөө",
        loading_text: "Жүктөө...",
        welcome_message: "Кош келиңиз,",
        // search_message_performing_search убрано
        search_message_no_subscribers_found: "Сурооңуз боюнча абоненттер табылган жок.",
        search_message_error: "Издөө учурунда ката кетти.",
        search_message_network_error: "Издөө учурунда тармактык ката кетти. Интернет байланышыңызды текшериңиз.",
        search_message_select_mp: "Сураныч, Муниципалдык ишкананы тандаңыз.",
        results_heading: "Натыйжалар",
        results_count_found: "табылды",
        results_message_no_subscribers: "Көрсөтүлө турган абоненттер жок.",
        back_to_search_button: "← Издөөгө кайтуу",
        pagination_page_info: "Барак {current} ичинен {total}",
        pagination_prev: "Мурунку",
        pagination_next: "Кийинки",
        ls_label: "Өздүк эсеп:",
        fio_label: "Аты-жөнү:",
        locality_label: "Калктуу пункт:",
        street_label: "Көчө:",
        house_label: "Үй:",
        flat_label: "Батир:",
        balance_label: "Баланс:",
        debt_label: "Карыз:",
        overpayment_label: "Ашыкча төлөм:",
        mp_label: "Муниципалдык ишкана:",
        select_service: "Кызматты тандаңыз",
        enter_amount: "Төлөө суммасын киргизиңиз",
        accept_payment_button_cash: "Төлөмдү кабыл алуу (Нак)",
        accept_payment_button_terminal: "Төлөмдү кабыл алуу (Терминал)",
        payment_success: "Төлөм ийгиликтүү иштетилди.",
        payment_error: "Төлөмдү иштетүүдө ката.",
        payment_error_network: "Төлөмдү иштетүүдө тармактык ката.",
        payment_error_invalid_data: "Төлөм үчүн жараксыз маалыматтар.",
        search_mp_placeholder: "Муниципалдык ишкананы тандаңыз",
        search_account_placeholder: "Өздүк эсеп номерин киргизиңиз",
        search_fio_placeholder: "Аты-жөнүн киргизиңиз (толугу менен же бир бөлүгүн)",
        search_button: "Издөө",
        logout_button: "Системадан чыгуу",
    },
    en: {
        login_heading: "Login",
        login_label: "Username:",
        password_label: "Password:",
        login_button: "Login",
        login_error_id_not_defined: "Error: Device identifier not defined.",
        login_error_auth_check: "An error occurred while checking authorization. Check your network connection.",
        login_success: "Authorization successful!",
        login_error_auth_failed: "Vtiger authorization error. Check your username/password.",
        login_error_hash_failed: "Error getting password hash.",
        login_error_critical: "An unexpected error occurred. Please check your internet connection or try again later.",
        logout_confirm_message: "Do you really want to log out?",
        logout_success: "You have successfully logged out.",
        logout_error: "Error logging out.",
        logout_error_network: "An unexpected error occurred while logging out. Check your network connection.",
        municipal_logout_button: "Log out of municipal enterprise",
        municipal_logout_confirm_message: "Do you really want to log out of the municipal enterprise?",
        // Модальные окна ожидания
        payment_waiting_title: "Waiting for payment",
        payment_waiting_status: "Waiting for terminal confirmation...",
        payment_waiting_cancel: "Cancel",
        payment_waiting_button: "Waiting...",
        payment_processing_button: "Processing...",
        payment_confirm_question: "Confirm the payment",
        payment_confirm_fio: "Full name",
        payment_confirm_service: "Service",
        payment_confirm_amount: "Amount",
        payment_confirm_currency: "KGS",
        payment_confirm_confirm: "Confirm",
        payment_confirm_cancel: "Cancel",
        // Сообщения об успехе и ошибках
        payment_terminal_success: "✅ Payment successfully created after terminal confirmation",
        payment_cancelled: "❌ Payment cancelled",
        payment_terminal_error: "❌ Terminal error: ",
        payment_flutter_error: "❌ Error: Flutter not available",
        payment_network_error: "❌ Payment error. Check your internet connection.",
        payment_success_message: "✅ Payment successfully created",
        payment_error_message: "❌ Error creating payment",
        // Валидация
        validation_select_service: "Select service",
        validation_enter_amount: "Enter correct amount",
        select_service: "Select service",
        // Заглушки данных
        data_not_available: "N/A",
        data_unknown: "Unknown",
        // Названия языков
        language_russian: "Russian",
        language_kyrgyz: "Kyrgyz",
        language_english: "English",
        search_heading: "Subscriber search",
        search_address_title: "Search by address",
        search_by_subscriber_data_title: "Search by subscriber data",
        loading_text: "Loading...",
        welcome_message: "Welcome,",
        // search_message_performing_search убрано
        search_message_no_subscribers_found: "No subscribers found for your request.",
        search_message_error: "Error performing search.",
        search_message_network_error: "Network error during search. Check your internet connection.",
        search_message_select_mp: "Please select a Municipal Enterprise.",
        results_heading: "Results",
        results_count_found: "found",
        results_message_no_subscribers: "No subscribers to display.",
        pagination_page_info: "Page {current} of {total}",
        back_to_search_button: "Back to search",
        ls_label: "Account number:",
        fio_label: "Full name:",
        locality_label: "Locality:",
        street_label: "Street:",
        house_label: "House:",
        flat_label: "Flat:",
        balance_label: "Balance:",
        debt_label: "Debt:",
        overpayment_label: "Overpayment:",
        payment_success: "Payment successfully processed.",
        payment_error: "Error processing payment.",
        payment_error_network: "Network error processing payment.",
        payment_error_invalid_data: "Invalid payment data.",
        search_mp_placeholder: "Select Municipal Enterprise",
        search_account_placeholder: "Enter account number",
        search_fio_placeholder: "Enter full name (complete or partial)",
        mp_label: "Municipal Enterprise:",
        search_button: "Search",
        accept_payment_button_cash: "Accept payment (Cash)",
        accept_payment_button_terminal: "Accept payment (Terminal)",
        logout_button: "Log out",
    },
};

// Функция получения перевода
function getTranslation(key) {
    return translations[currentLanguage][key] || key;
}

// Функция установки языка
function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        localStorage.setItem("appLanguage", lang);
        updateContentLanguage();
        return true;
    }
    return false;
}

// Функция получения текущего языка
function getCurrentLanguage() {
    return currentLanguage;
}

// Функция получения доступных языков
function getAvailableLanguages() {
    return Object.keys(translations);
}

// Функция обновления названий языков в селекторах
function updateLanguageSelectors() {
    const selectors = [
        document.getElementById("languageSelector"),
        document.getElementById("languageSelectorSearch"),
        document.getElementById("languageSelectorResults")
    ];

    selectors.forEach(selector => {
        if (selector) {
            // Обновляем data-атрибуты с переводами
            const ruOption = selector.querySelector('option[value="ru"]');
            const kyOption = selector.querySelector('option[value="ky"]');
            const enOption = selector.querySelector('option[value="en"]');

            if (ruOption) {
                ruOption.setAttribute('data-name', getTranslation("language_russian"));
                ruOption.title = getTranslation("language_russian");
            }
            if (kyOption) {
                kyOption.setAttribute('data-name', getTranslation("language_kyrgyz"));
                kyOption.title = getTranslation("language_kyrgyz");
            }
            if (enOption) {
                enOption.setAttribute('data-name', getTranslation("language_english"));
                enOption.title = getTranslation("language_english");
            }
        }
    });
}

// Функция инициализации обработчиков событий для селекторов
function initLanguageSelectors() {
    const selectors = [
        document.getElementById("languageSelector"),
        document.getElementById("languageSelectorSearch"),
        document.getElementById("languageSelectorResults")
    ];

    selectors.forEach(selector => {
        if (selector) {
            // При фокусе (открытии) показываем флаг + название
            selector.addEventListener('focus', function () {
                const options = this.querySelectorAll('option');
                options.forEach(option => {
                    const flag = option.getAttribute('data-flag');
                    const name = option.getAttribute('data-name');
                    if (flag && name) {
                        option.textContent = `${flag} ${name}`;
                    }
                });
            });

            // При потере фокуса (закрытии) показываем только флаг
            selector.addEventListener('blur', function () {
                const options = this.querySelectorAll('option');
                options.forEach(option => {
                    const flag = option.getAttribute('data-flag');
                    if (flag) {
                        option.textContent = flag;
                    }
                });
            });

            // При изменении значения обновляем отображение
            selector.addEventListener('change', function () {
                // Небольшая задержка для корректного отображения
                setTimeout(() => {
                    const options = this.querySelectorAll('option');
                    options.forEach(option => {
                        const flag = option.getAttribute('data-flag');
                        if (flag) {
                            option.textContent = flag;
                        }
                    });
                }, 100);
            });
        }
    });
}

// Функция обновления контента на выбранном языке
function updateContentLanguage() {
    // Получаем элементы DOM
    const loginHeading = document.getElementById("loginHeading");
    const loginButton = document.getElementById("loginButton");
    const searchHeading = document.getElementById("searchHeading");
    const resultsHeading = document.getElementById("resultsHeading");
    const backToSearchButton = document.getElementById("backToSearchButton");
    const prevPageButton = document.getElementById("prevPageButton");
    const nextPageButton = document.getElementById("nextPageButton");
    const logoutButtonSearch = document.getElementById("logoutButtonSearch");
    const searchMunicipalEnterprise = document.getElementById("searchMunicipalEnterprise");
    const searchAccount = document.getElementById("searchAccount");
    const searchFIO = document.getElementById("searchFIO");
    const searchForm = document.getElementById("searchForm");

    // Обновляем заголовки
    if (loginHeading) loginHeading.textContent = getTranslation("login_heading");
    if (loginButton) loginButton.textContent = getTranslation("login_button");
    if (searchHeading) searchHeading.textContent = getTranslation("search_heading");
    if (resultsHeading) resultsHeading.textContent = getTranslation("results_heading");

    // Обновляем tooltips для иконок (кнопки теперь с иконками)
    if (backToSearchButton) backToSearchButton.title = getTranslation("back_to_search_button");
    if (logoutButtonSearch) logoutButtonSearch.title = getTranslation("logout_button");

    // Обновляем tooltip для кнопки выхода из муниципального предприятия
    const logoutButtonLogin = document.getElementById("logoutButtonLogin");
    if (logoutButtonLogin) logoutButtonLogin.title = getTranslation("municipal_logout_button");

    // Обновляем названия языков в селекторах
    updateLanguageSelectors();

    // Инициализируем обработчики событий для селекторов
    initLanguageSelectors();

    // Обновляем лейблы
    const loginLabel = document.querySelector('label[for="login"]');
    if (loginLabel) loginLabel.textContent = getTranslation("login_label");

    // Обновляем заголовок поиска по адресу
    const searchAddressTitle = document.getElementById("searchAddressTitle");
    if (searchAddressTitle) searchAddressTitle.textContent = getTranslation("search_address_title");

    // Обновляем заголовок поиска по данным абонента
    const searchBySubscriberDataTitle = document.getElementById("searchBySubscriberDataTitle");
    if (searchBySubscriberDataTitle) searchBySubscriberDataTitle.textContent = getTranslation("search_by_subscriber_data_title");

    // Обновляем текст загрузки
    const loadingText = document.getElementById("loadingText");
    if (loadingText) loadingText.textContent = getTranslation("loading_text");

    const passwordLabel = document.querySelector('label[for="password"]');
    if (passwordLabel) passwordLabel.textContent = getTranslation("password_label");

    const mpLabel = document.querySelector('label[for="searchMunicipalEnterprise"]');
    if (mpLabel) mpLabel.textContent = getTranslation("mp_label");

    const accountLabel = document.querySelector('label[for="searchAccount"]');
    if (accountLabel) accountLabel.textContent = getTranslation("ls_label");

    const fioLabel = document.querySelector('label[for="searchFIO"]');
    if (fioLabel) fioLabel.textContent = getTranslation("fio_label");

    // Обновляем приветствие
    const userInfoElement = document.querySelector(".user-info");
    if (userInfoElement && userInfoElement.firstChild) {
        userInfoElement.firstChild.nodeValue = getTranslation("welcome_message") + " ";
    }

    // Обновляем плейсхолдеры
    if (searchMunicipalEnterprise) {
        const mpOption = searchMunicipalEnterprise.querySelector('option[value=""]');
        if (mpOption) mpOption.textContent = getTranslation("search_mp_placeholder");
    }

    if (searchAccount) searchAccount.placeholder = getTranslation("search_account_placeholder");
    if (searchFIO) searchFIO.placeholder = getTranslation("search_fio_placeholder");

    // Обновляем кнопки
    if (searchForm) {
        const searchSubmitButton = searchForm.querySelector('button[type="submit"]');
        if (searchSubmitButton) searchSubmitButton.textContent = getTranslation("search_button");
    }
}

// Функция инициализации языковой системы
function initLanguageSystem() {
    // Список всех селекторов языка
    const languageSelectors = [
        "languageSelector",        // Экран входа
        "languageSelectorSearch",  // Экран поиска
        "languageSelectorResults"  // Экран результатов
    ];

    // Устанавливаем обработчики для всех селекторов
    languageSelectors.forEach(selectorId => {
        const languageSelector = document.getElementById(selectorId);
        if (languageSelector) {
            languageSelector.value = currentLanguage;
            languageSelector.addEventListener("change", (event) => {
                const newLang = event.target.value;
                if (setLanguage(newLang)) {
                    // Синхронизируем все селекторы
                    syncAllLanguageSelectors(newLang);

                    // Если есть экран результатов, перерисовываем его
                    const resultsScreen = document.getElementById("resultsScreen");
                    if (resultsScreen && resultsScreen.classList.contains("active")) {
                        // Вызываем глобальную функцию renderCurrentPageResults если она существует
                        if (typeof window.renderCurrentPageResults === 'function') {
                            window.renderCurrentPageResults();
                        }
                    }
                }
            });
        }
    });

    // Обновляем контент при инициализации
    updateContentLanguage();
}

// Функция синхронизации всех селекторов языка
function syncAllLanguageSelectors(lang) {
    const languageSelectors = [
        "languageSelector",
        "languageSelectorSearch",
        "languageSelectorResults"
    ];

    languageSelectors.forEach(selectorId => {
        const selector = document.getElementById(selectorId);
        if (selector) {
            selector.value = lang;
        }
    });
}

// Экспортируем функции для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        getTranslation,
        setLanguage,
        getCurrentLanguage,
        getAvailableLanguages,
        updateContentLanguage,
        initLanguageSystem,
        syncAllLanguageSelectors,
        translations
    };
} else {
    // Браузер - добавляем в глобальную область видимости
    window.LanguageSystem = {
        getTranslation,
        setLanguage,
        getCurrentLanguage,
        getAvailableLanguages,
        updateContentLanguage,
        initLanguageSystem,
        syncAllLanguageSelectors,
        translations
    };
}
