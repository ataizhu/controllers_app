// app.js
// Конфигурация загружается из config.js
const BASE_API_URL = (window.CONFIG && window.CONFIG.BASE_API_URL) ? window.CONFIG.BASE_API_URL : "./cotroller.php";
const CHECK_PASS_URL = (window.CONFIG && window.CONFIG.CHECK_PASS_URL) ? window.CONFIG.CHECK_PASS_URL : "../checkPass.php";

// Глобальные переменные для терминала
let terminalSerialNumber = null;
let operatorLogin = null;
let pendingSettingsOpen = false; // Флаг для отслеживания запроса на открытие настроек
let pendingPaymentAfterSerialNumber = null; // Данные платежа ожидающие серийный номер

// Переменные для налогов
let vat_value = 12.00; // НДС (Налог на добавленную стоимость)
let st_value = 2.00; // НСП (Налог с продаж)

// Обработчики для Flutter - объявляем сразу, чтобы были доступны до загрузки DOM
// Обработчик получения серийного номера от Flutter (вызывается Flutter'ом после нашего запроса)
window.getSerialNumber = function (serialNumber) {
  console.log('📱 Получен серийный номер терминала от Flutter:', serialNumber);
  terminalSerialNumber = serialNumber;

  // Сохраняем в sessionStorage для надежности
  try {
    sessionStorage.setItem('terminalSerialNumber', serialNumber);
  } catch (e) {
    console.log('⚠️ Не удалось сохранить серийный номер в sessionStorage:', e);
  }

  // Закрываем модальное окно ожидания, если оно открыто
  if (window.currentSerialNumberWaitingModal) {
    window.currentSerialNumberWaitingModal.remove();
    window.currentSerialNumberWaitingModal = null;
  }

  // Если был запрос на открытие настроек - открываем модальное окно
  if (pendingSettingsOpen) {
    pendingSettingsOpen = false;
    // Используем setTimeout чтобы убедиться что DOM загружен
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        showOperatorLoginSettings(serialNumber);
      });
    } else {
      showOperatorLoginSettings(serialNumber);
    }
    return;
  }

  // Если есть ожидающий платеж - проверяем operator_login в БД и продолжаем оплату
  if (pendingPaymentAfterSerialNumber) {
    const paymentData = pendingPaymentAfterSerialNumber;
    pendingPaymentAfterSerialNumber = null;

    console.log('💳 Обработка платежа после получения серийного номера:', serialNumber);

    // Убеждаемся что terminalSerialNumber установлен
    terminalSerialNumber = serialNumber;
    console.log('✅ terminalSerialNumber установлен:', terminalSerialNumber);

    // Проверяем operator_login в БД для данного терминала
    if (typeof getOperatorLoginFromDB === 'function') {
      console.log('🔍 Проверяем operator_login в БД для терминала:', serialNumber);
      getOperatorLoginFromDB(serialNumber)
        .then(function (login) {
          if (!login) {
            // operator_login не найден - показываем сообщение и прерываем
            console.error('❌ operator_login не найден в БД для терминала:', serialNumber);
            if (paymentData.button) {
              paymentData.button.disabled = false;
              paymentData.button.textContent = getTranslationSafe("accept_payment_button_terminal");
            }
            showAlertWithKeyboardHide('Для данного терминала не настроен operator_login.');
            return;
          }

          // operator_login найден - сохраняем и продолжаем оплату
          operatorLogin = login;
          console.log('✅ Operator login проверен перед оплатой:', operatorLogin);

          // Сохраняем в sessionStorage для надежности
          try {
            sessionStorage.setItem('terminalSerialNumber', serialNumber);
            sessionStorage.setItem('operatorLogin', login);
          } catch (e) {
            console.log('⚠️ Не удалось сохранить в sessionStorage:', e);
          }

          // Продолжаем процесс оплаты - запрашиваем токен
          console.log('🔑 Запрашиваем токен для платежа...');
          getValidToken()
            .then(function (token) {
              console.log('✅ Токен получен, отправляем платеж в Flutter');
              paymentData.paymentData.megapay_token = token;
              sendPaymentToFlutter(paymentData.paymentData, paymentData.button, paymentData.details, paymentData.flutterPaymentType);
            })
            .catch(function (error) {
              console.error("❌ Ошибка получения токена:", error);
              if (paymentData.button) {
                paymentData.button.disabled = false;
                paymentData.button.textContent = getTranslationSafe("accept_payment_button_terminal");
              }
              const errorMessage = error.message || error.toString();
              showAlertWithKeyboardHide(errorMessage || "Ошибка получения токена авторизации. Попробуйте позже.");
            });
        })
        .catch(function (error) {
          console.error('❌ Ошибка проверки operator_login перед оплатой:', error);
          if (paymentData.button) {
            paymentData.button.disabled = false;
            paymentData.button.textContent = getTranslationSafe("accept_payment_button_terminal");
          }
          showAlertWithKeyboardHide('Ошибка проверки настроек терминала. Попробуйте еще раз.');
        });
    } else {
      console.log('⚠️ Функция getOperatorLoginFromDB еще не загружена, повторим попытку через 100мс');
      setTimeout(function () {
        window.getSerialNumber(serialNumber); // Повторяем вызов
      }, 100);
    }
    return;
  }

  // Если это не запрос настроек и не ожидающий платеж, просто обрабатываем серийный номер (загружаем operator_login из БД)
  // Используем setTimeout чтобы убедиться что DOM загружен
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      handleSerialNumber(serialNumber);
    });
  } else {
    handleSerialNumber(serialNumber);
  }
};

// Функция обработки серийного номера (вызывается после загрузки DOM)
function handleSerialNumber(serialNumber) {
  if (typeof getOperatorLoginFromDB === 'function') {
    getOperatorLoginFromDB(serialNumber)
      .then(function (login) {
        if (login) {
          operatorLogin = login;
          console.log('✅ Operator login загружен из БД:', login);
        } else {
          console.log('⚠️ Operator login не найден для терминала:', serialNumber);
          console.log('📝 Operator login можно настроить через кнопку настроек терминала');
          // Не показываем окно автоматически, только по кнопке
        }
      });
  } else {
    console.log('⚠️ Функция getOperatorLoginFromDB еще не загружена, повторим попытку через 100мс');
    setTimeout(function () {
      handleSerialNumber(serialNumber);
    }, 100);
  }
}

// Алиас для совместимости (если Flutter будет вызывать старое имя)
window.getTerminalSerialNumber = window.getSerialNumber;

const loadingScreen = document.getElementById("loadingMessage");
const loginScreen = document.getElementById("loginScreen");
const searchScreen = document.getElementById("searchScreen");
const resultsScreen = document.getElementById("resultsScreen");

const loginForm = document.getElementById("loginForm");
const messageDiv = document.getElementById("message");
const languageSelector = document.getElementById("languageSelector");
const loginHeading = document.getElementById("loginHeading");
const loginButton = document.getElementById("loginButton");
const logoutButtonSearch = document.getElementById("logoutButtonSearch");
const logoutButtonLogin = document.getElementById("logoutButtonLogin");
let controllerNameDisplay = null; // Будет инициализирован после загрузки DOM

const searchForm = document.getElementById("searchForm");
const searchMessageDiv = document.getElementById("searchMessage");
const searchFIO = document.getElementById("searchFIO");
const searchAccount = document.getElementById("searchAccount");
const searchMunicipalEnterprise = document.getElementById("searchMunicipalEnterprise");

const backToSearchButton = document.getElementById("backToSearchButton");
const searchResultsList = document.getElementById("searchResultsList");
const resultsCountSpan = document.getElementById("resultsCount");
// resultsMessageDiv убран
const searchHeading = document.getElementById("searchHeading");
const resultsHeading = document.getElementById("resultsHeading");

const paginationContainer = document.getElementById("pagination");
const prevPageButton = document.getElementById("prevPageButton");
const nextPageButton = document.getElementById("nextPageButton");
const pageInfoSpan = document.getElementById("pageInfo");

let clientPhoneIdentifier = null;
let allFoundSubscribers = [];
let availableServices = [];
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
// Языковая система вынесена в отдельный файл language.js

// Вспомогательная функция для безопасного получения переводов
function getTranslationSafe(key, fallback) {
  if (fallback === undefined) fallback = null;
  if (window.LanguageSystem && window.LanguageSystem.getTranslation) {
    return window.LanguageSystem.getTranslation(key);
  }

  // Если language.js не загружен, возвращаем fallback или ключ
  return fallback || key;
}

async function safeJsonParse(response) {
  try {
    const text = await response.text();


    if (!text.trim()) {
      throw new Error("Пустой ответ от сервера");
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("JSON parse error:", error);
    throw new Error("Неверный формат ответа от сервера");
  }
}

// Функция updateContentLanguage() перенесена в language.js

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
    screen.classList.remove("active");
  });
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add("active");
    // Стили применяются через CSS класс .screen.active
  }
}

function getOrCreatePhoneIdentifier() {
  try {
    let id = localStorage.getItem("client_phone_identifier");

    if (!id || id.trim() === "") {
      id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });

      localStorage.setItem("client_phone_identifier", id);
      // Отладочные сообщения убраны
    } else {
      // Отладочные сообщения убраны
    }

    return id;
  } catch (error) {
    console.error("Ошибка при работе с localStorage:", error);
    return "temp-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
  }
}

function displayMessage(element, text, type) {
  if (!element) return;

  element.textContent = text;
  element.className = "message";
  if (type) {
    element.classList.add(type);
  }
  if (type === "success" || type === "error") {
    setTimeout(() => {
      element.textContent = "";
      element.className = "message";
    }, 5000);
  }
}

function setControllerName(name, userId = '1') {
  // Всегда ищем элемент заново для надежности
  const element = document.getElementById("controllerNameDisplay");

  if (element) {
    element.textContent = name;
    element.setAttribute('data-user-id', userId);

    // Принудительно устанавливаем стили через JavaScript
    element.style.color = "#000000";
    element.style.fontWeight = "600";

    // Адаптивный размер шрифта
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;

    if (isSmallMobile) {
      element.style.fontSize = "0.8rem";
    } else if (isMobile) {
      element.style.fontSize = "0.85rem";
    } else {
      element.style.fontSize = "0.95rem";
    }

    element.style.display = "block";
    element.style.visibility = "visible";
    element.style.opacity = "1";
  }
}

// Универсальная система модальных окон
const ModalSystem = {
  // Скрытие клавиатуры на мобильных
  hideKeyboard(callback) {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT' || activeElement.tagName === 'TEXTAREA')) {
      activeElement.blur();
    }

    if (window.innerWidth <= 768) {
      const tempInput = document.createElement('input');
      Object.assign(tempInput.style, {
        position: 'absolute', left: '-9999px', opacity: '0',
        pointerEvents: 'none', height: '0', width: '0',
        border: 'none', outline: 'none'
      });
      document.body.appendChild(tempInput);

      let originalType = null;
      if (activeElement && activeElement.tagName === 'INPUT' && activeElement.type !== 'hidden') {
        originalType = activeElement.type;
        activeElement.type = 'hidden';
      }

      tempInput.focus();
      setTimeout(() => {
        tempInput.blur();
        document.body.removeChild(tempInput);
        if (activeElement && originalType) activeElement.type = originalType;
        setTimeout(callback, 100);
      }, 200);
    } else {
      callback();
    }
  },

  // Создание модального окна
  createModal(id, type, message, buttons) {
    // Удаляем существующее модальное окно
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal-overlay';

    const content = document.createElement('div');
    content.className = `modal-content ${type}-content`;

    const messageEl = document.createElement('div');
    messageEl.className = `modal-message ${type}-message`;
    messageEl.textContent = message;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'modal-buttons';

    buttons.forEach(button => {
      const btn = document.createElement('button');
      btn.className = `modal-button ${button.class || ''}`;
      btn.textContent = button.text;
      btn.addEventListener('click', () => {
        modal.remove();
        if (button.callback) button.callback();
      });
      buttonContainer.appendChild(btn);
    });

    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.remove();
        var cancelBtn = buttons.find(function (b) {
          return b.class && b.class.includes('cancel');
        });
        if (cancelBtn && cancelBtn.callback) {
          cancelBtn.callback();
        }
      }
    });

    content.appendChild(messageEl);
    content.appendChild(buttonContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Фокус на первой кнопке
    const firstButton = buttonContainer.querySelector('button');
    if (firstButton) firstButton.focus();
  },

  // Показать alert
  alert(message) {
    this.hideKeyboard(() => {
      this.createModal('customModal', 'alert', message, [
        { text: 'OK', class: 'primary' }
      ]);
    });
  },

  // Показать confirm
  confirm(message, onConfirm, onCancel) {
    this.hideKeyboard(() => {
      this.createModal('customModal', 'confirm', message, [
        { text: 'Отмена', class: 'cancel', callback: onCancel },
        { text: 'Да', class: 'primary', callback: onConfirm }
      ]);
    });
  }
};

// Упрощенные функции для обратной совместимости
function showAlertWithKeyboardHide(message) {
  ModalSystem.alert(message);
}

function showCustomAlert(message) {
  ModalSystem.alert(message);
}

function showCustomConfirm(message, onConfirm, onCancel) {
  ModalSystem.confirm(message, onConfirm, onCancel);
}

async function checkPhoneAuth() {
  // Инициализируем языковую систему
  if (typeof window.LanguageSystem !== 'undefined') {
    window.LanguageSystem.initLanguageSystem();
  }

  clientPhoneIdentifier = getOrCreatePhoneIdentifier();

  if (!clientPhoneIdentifier || clientPhoneIdentifier.trim() === "") {
    console.error("Failed to get or create phone identifier");
    displayMessage(messageDiv, window.LanguageSystem.getTranslationSafe("login_error_id_not_defined"), "error");
    showScreen("loginScreen");
    return;
  }

  try {
    const response = await fetch(BASE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "checkAuth",
        phoneIdentifier: clientPhoneIdentifier
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await safeJsonParse(response);

    if (data.success && data.data !== "empty" && data.data.username) {
      setControllerName(data.data.fullname || data.data.username, data.data.vtiger_user_id || '1');
      showScreen("searchScreen");
      loadServicesDropdown();
    } else {
      showScreen("loginScreen");
    }
  } catch (error) {
    console.error("Ошибка при проверке авторизации по идентификатору телефона:", error);
    displayMessage(messageDiv, getTranslationSafe("login_error_auth_check"), "error");
    showScreen("loginScreen");
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showScreen("loadingMessage");
    displayMessage(messageDiv, "", "");

    const login = document.getElementById("login").value;
    const password = document.getElementById("password").value;

    if (!clientPhoneIdentifier) {
      displayMessage(messageDiv, window.LanguageSystem.getTranslationSafe("login_error_id_not_defined"), "error");
      showScreen("loginScreen");
      return;
    }

    // Проверяем серийный номер терминала и operator_login
    // Восстанавливаем из sessionStorage если потерян
    if (!terminalSerialNumber) {
      try {
        const savedSerialNumber = sessionStorage.getItem('terminalSerialNumber');
        if (savedSerialNumber) {
          console.log('📱 Восстановлен серийный номер из sessionStorage при логине:', savedSerialNumber);
          terminalSerialNumber = savedSerialNumber;
        }
      } catch (e) {
        console.log('⚠️ Не удалось прочитать sessionStorage:', e);
      }
    }

    // Если есть серийный номер - проверяем operator_login
    if (terminalSerialNumber) {
      try {
        console.log('🔍 Проверка operator_login для терминала:', terminalSerialNumber);
        const operatorLoginFromDB = await getOperatorLoginFromDB(terminalSerialNumber);
        if (!operatorLoginFromDB) {
          displayMessage(messageDiv, 'Для данного терминала не настроен operator_login. Пожалуйста, настройте его через кнопку настроек терминала.', "error");
          showScreen("loginScreen");
          return;
        }
        // Сохраняем operator_login в глобальную переменную
        operatorLogin = operatorLoginFromDB;
        console.log('✅ Operator login проверен при логине:', operatorLogin);
      } catch (error) {
        console.error('❌ Ошибка проверки operator_login:', error);
        displayMessage(messageDiv, 'Ошибка проверки настроек терминала. Попробуйте еще раз.', "error");
        showScreen("loginScreen");
        return;
      }
    }

    try {
      const responseHash = await fetch(CHECK_PASS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `username=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`,
      });

      if (!responseHash.ok) {
        throw new Error(`HTTP ${responseHash.status}: ${responseHash.statusText}`);
      }

      const dataHash = await safeJsonParse(responseHash);

      if (dataHash.success && dataHash.result) {
        const receivedHash = dataHash.result;

        const responseAuth = await fetch(BASE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "checkUser",
            username: login,
            hashed_password: receivedHash
          }),
        });

        if (!responseAuth.ok) {
          throw new Error(`HTTP ${responseAuth.status}: ${responseAuth.statusText}`);
        }

        const dataAuth = await safeJsonParse(responseAuth);


        if (dataAuth.success) {
          const userVtigerId = dataAuth.user_id;
          const userFullname = dataAuth.fullname;

          const checkAuthResponse = await fetch(BASE_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "checkAuth",
              phoneIdentifier: clientPhoneIdentifier
            }),
          });

          if (!checkAuthResponse.ok) {
            throw new Error(`HTTP ${checkAuthResponse.status}: ${checkAuthResponse.statusText}`);
          }

          const checkAuthData = await safeJsonParse(checkAuthResponse);

          let authPhoneResponse;
          if (checkAuthData.success && checkAuthData.data !== "empty") {
            authPhoneResponse = await fetch(BASE_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "updateAuth",
                phoneIdentifier: clientPhoneIdentifier,
                vtiger_user_id: userVtigerId
              }),
            });
          } else {
            authPhoneResponse = await fetch(BASE_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "addAuth",
                phoneIdentifier: clientPhoneIdentifier,
                vtiger_user_id: userVtigerId
              }),
            });
          }

          if (!authPhoneResponse.ok) {
            throw new Error(`HTTP ${authPhoneResponse.status}: ${authPhoneResponse.statusText}`);
          }

          const authPhoneData = await safeJsonParse(authPhoneResponse);

          if (authPhoneData.success) {
            displayMessage(messageDiv, getTranslationSafe("login_success"), "success");
            setControllerName(userFullname || login, userVtigerId || '1');
            showScreen("searchScreen");
            loadServicesDropdown();
          } else {
            displayMessage(messageDiv, authPhoneData.message || getTranslationSafe("login_error_auth_failed"), "error");
            showScreen("loginScreen");
          }
        } else {
          displayMessage(messageDiv, dataAuth.message || getTranslationSafe("login_error_auth_failed"), "error");
          showScreen("loginScreen");
        }
      } else {
        displayMessage(messageDiv, dataHash.message || getTranslationSafe("login_error_hash_failed"), "error");
        showScreen("loginScreen");
      }
    } catch (error) {
      console.error("Произошла критическая ошибка при входе:", error);
      displayMessage(messageDiv, getTranslationSafe("login_error_critical"), "error");
      showScreen("loginScreen");
    }
  });
}

function handleLogout() {
  // Показываем подтверждение выхода
  const confirmMessage = getTranslationSafe("logout_confirm_message");
  showCustomConfirm(confirmMessage, () => {
    // Пользователь подтвердил выход
    performLogout();
  });
  // Функция не завершается здесь, ждем ответа пользователя
}

function performLogout() {

  if (!clientPhoneIdentifier) {
    console.warn("Не могу выйти: Идентификатор устройства не установлен.");
    showScreen("loginScreen");
    return;
  }

  fetch(BASE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "logout",
      phoneIdentifier: clientPhoneIdentifier
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        localStorage.removeItem("client_phone_identifier");
        clientPhoneIdentifier = null;
        location.reload();
      } else {
        displayMessage(messageDiv, data.message || getTranslationSafe("logout_error"), "error");
        localStorage.removeItem("client_phone_identifier");
        clientPhoneIdentifier = null;
        location.reload();
      }
    })
    .catch((error) => {
      console.error("Ошибка при отправке запроса на выход:", error);
      displayMessage(messageDiv, getTranslationSafe("logout_error_network"), "error");
      localStorage.removeItem("client_phone_identifier");
      clientPhoneIdentifier = null;
      location.reload();
    });
}

function handleMunicipalLogout() {
  // Показываем подтверждение выхода из муниципального предприятия
  const confirmMessage = getTranslationSafe("municipal_logout_confirm_message");
  showCustomConfirm(confirmMessage, () => {
    // Пользователь подтвердил выход
    performMunicipalLogout();
  });
  // Функция не завершается здесь, ждем ответа пользователя
}

function performMunicipalLogout() {

  // Отправляем уведомление в Flutter о полном выходе
  if (window.flutter_inappwebview) {
    window.flutter_inappwebview.callHandler("onMunicipalLogout");
  }

  // Очищаем все данные
  localStorage.removeItem("client_phone_identifier");
  clientPhoneIdentifier = null;
}

if (logoutButtonSearch) {
  logoutButtonSearch.addEventListener("click", handleLogout);
}

if (logoutButtonLogin) {
  logoutButtonLogin.addEventListener("click", handleMunicipalLogout);
}

if (backToSearchButton) {
  backToSearchButton.addEventListener("click", () => {
    showScreen("searchScreen");
    if (searchResultsList) searchResultsList.innerHTML = "";
    allFoundSubscribers = [];
    currentPage = 1;
    if (resultsCountSpan) resultsCountSpan.textContent = "";
    // resultsMessageDiv убран

    if (searchFIO) searchFIO.value = "";
    if (searchAccount) searchAccount.value = "";
    if (searchMunicipalEnterprise) searchMunicipalEnterprise.value = "";
  });
}

async function loadServicesDropdown() {
  try {
    const response = await fetch(BASE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "getServices"
      }),
    });
    const data = await response.json();

    if (data.success && data.services && data.services.length > 0) {
      availableServices = data.services;

    } else {
      console.warn("Услуги не найдены");
      availableServices = [];
    }
  } catch (error) {
    console.error("Ошибка при загрузке услуг:", error);
    availableServices = [];
  }
}

if (searchForm) {
  searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    displayMessage(searchMessageDiv, "", "");

    if (searchResultsList) searchResultsList.innerHTML = "";
    allFoundSubscribers = [];
    currentPage = 1;

    const mpId = searchMunicipalEnterprise ? searchMunicipalEnterprise.value.trim() : "";
    const fio = searchFIO ? searchFIO.value.trim() : "";
    const accountNumber = searchAccount ? searchAccount.value.trim() : "";

    // Отладочные сообщения убраны

    // Проверка: МП должно быть выбрано обязательно
    if (!mpId || mpId === "") {
      showAlertWithKeyboardHide(getTranslationSafe("search_message_select_mp"));
      return;
    }



    const searchParams = {
      action: "searchSubscribers",
      mp_id: mpId,
      fio: fio,
      account_number: accountNumber,
    };

    // Убираем сообщение "Выполняется поиск"

    try {
      const response = await fetch(BASE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchParams),
      });

      const data = await response.json();


      if (data.success) {
        if (data.data && data.data.length > 0) {
          allFoundSubscribers = data.data;
          if (resultsCountSpan) {
            resultsCountSpan.textContent = `(${allFoundSubscribers.length} ${getTranslationSafe("results_count_found")})`;
          }
          showScreen("resultsScreen");
          renderCurrentPageResults();
          // resultsMessageDiv убран
        } else {
          allFoundSubscribers = [];
          if (resultsCountSpan) {
            resultsCountSpan.textContent = `(0 ${getTranslationSafe("results_count_found")})`;
          }
          showScreen("resultsScreen");
          renderCurrentPageResults();
          // resultsMessageDiv убран
        }
      } else {
        displayMessage(searchMessageDiv, data.message || getTranslationSafe("search_message_error"), "error");
      }
    } catch (error) {
      console.error("Ошибка сети при поиске:", error);
      displayMessage(searchMessageDiv, getTranslationSafe("search_message_network_error"), "error");
    }
  });
}

// Функция для получения токена - ВСЕГДА получает новый токен
function getValidToken() {
  return new Promise(function (resolve, reject) {
    console.log('🔄 Запрашиваем новый токен для платежа...');
    requestNewToken()
      .then(function (newToken) {
        console.log('✅ Новый токен получен:', newToken);
        resolve(newToken);
      })
      .catch(function (error) {
        console.error('❌ Не удалось получить новый токен:', error);
        reject(error);
      });
  });
}

// Функция для отправки платежа во Flutter
function sendPaymentToFlutter(paymentData, button, details, paymentType) {
  if (!window.flutter_inappwebview) {
    showAlertWithKeyboardHide(getTranslationSafe("payment_flutter_error"));
    return;
  }

  const logMessage = paymentType === "CASH" ? "💰 Отправляем наличный платеж в Flutter:" : "💳 Отправляем карточный платеж в Flutter:";
  console.log(logMessage, paymentData);

  // Показываем модальное окно ожидания
  showPaymentWaitingModal(paymentData, button, details);

  // Отправляем данные в Flutter
  window.flutter_inappwebview.callHandler("onPayment", paymentData);
}

// Функция для получения operator_login из БД
function getOperatorLoginFromDB(serialNumber) {
  return new Promise(function (resolve, reject) {
    if (!serialNumber) {
      resolve(null);
      return;
    }

    fetch('terminal_settings.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getOperatorLogin',
        serial_number: serialNumber
      })
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success && data.operator_login) {
          console.log('✅ Operator login найден для терминала:', serialNumber);
          resolve(data.operator_login);
        } else {
          console.log('⚠️ Operator login не найден для терминала:', serialNumber);
          resolve(null);
        }
      })
      .catch(function (error) {
        console.error('❌ Ошибка получения operator_login:', error);
        resolve(null);
      });
  });
}

// Функция для сохранения operator_login в БД
function saveOperatorLogin(serialNumber, operatorLogin) {
  return new Promise(function (resolve, reject) {
    fetch('terminal_settings.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveOperatorLogin',
        serial_number: serialNumber,
        operator_login: operatorLogin
      })
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          console.log('✅ Operator login сохранен');
          resolve(true);
        } else {
          reject(new Error(data.message || 'Ошибка сохранения'));
        }
      })
      .catch(function (error) {
        reject(error);
      });
  });
}

// Функция для показа окна настройки operator_login
function showOperatorLoginSettings(serialNumber) {
  if (!serialNumber) {
    console.log('⚠️ Серийный номер терминала не передан');
    ModalSystem.alert('Серийный номер терминала еще не получен от Flutter. Пожалуйста, подождите пока Flutter отправит серийный номер терминала.');
    return;
  }

  // Загружаем operator_login из БД перед показом окна
  getOperatorLoginFromDB(serialNumber)
    .then(function (login) {
      // После получения данных показываем модальное окно
      ModalSystem.hideKeyboard(function () {
        const modal = document.createElement('div');
        modal.id = 'operatorLoginModal';
        modal.className = 'modal-overlay';

        const content = document.createElement('div');
        content.className = 'modal-content';

        const title = document.createElement('h2');
        title.textContent = 'Настройка терминала';
        title.style.cssText = 'margin: 0 0 15px 0;';

        const message = document.createElement('p');
        message.textContent = 'Серийный номер терминала: ' + serialNumber;
        message.style.cssText = 'margin: 0 0 15px 0; color: #666;';

        const form = document.createElement('div');

        // Если operator_login не найден в БД - показываем сообщение и инпут для ввода
        if (!login) {
          const infoMessage = document.createElement('p');
          infoMessage.textContent = 'Для данного терминала не настроен operator_login. Пожалуйста, введите operator_login для настройки терминала.';
          infoMessage.style.cssText = 'margin: 0 0 15px 0; color: #e74c3c; font-weight: bold;';
          form.appendChild(infoMessage);
        } else {
          // Если operator_login найден - показываем информационное сообщение
          const infoMessage = document.createElement('p');
          infoMessage.textContent = 'Текущий operator_login: ' + login;
          infoMessage.style.cssText = 'margin: 0 0 15px 0; color: #27ae60; font-weight: bold;';
          form.appendChild(infoMessage);
          operatorLogin = login; // Обновляем глобальную переменную
        }

        const label = document.createElement('label');
        label.textContent = 'Operator Login (email):';
        label.style.cssText = 'display: block; margin-bottom: 5px; font-weight: bold;';

        const input = document.createElement('input');
        input.type = 'email';
        input.id = 'operatorLoginInput';
        // Устанавливаем значение из БД, если оно есть
        if (login) {
          input.value = login;
        }
        input.style.cssText = 'width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px;';

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'modal-buttons';

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Сохранить';
        saveBtn.className = 'modal-button primary';
        saveBtn.onclick = function () {
          const loginValue = input.value.trim();

          if (!loginValue) {
            ModalSystem.alert('Введите operator login');
            return;
          }

          saveBtn.disabled = true;
          saveBtn.textContent = 'Сохранение...';

          saveOperatorLogin(serialNumber, loginValue)
            .then(function () {
              operatorLogin = loginValue;
              terminalSerialNumber = serialNumber; // Обновляем серийный номер при сохранении

              // Сохраняем в sessionStorage для надежности
              try {
                sessionStorage.setItem('terminalSerialNumber', serialNumber);
                sessionStorage.setItem('operatorLogin', loginValue);
              } catch (e) {
                console.log('⚠️ Не удалось сохранить в sessionStorage:', e);
              }

              console.log('✅ Operator login и серийный номер сохранены:', loginValue, serialNumber);
              modal.remove();
              ModalSystem.alert('Настройки сохранены');
            })
            .catch(function (error) {
              ModalSystem.alert('Ошибка сохранения: ' + error.message);
              saveBtn.disabled = false;
              saveBtn.textContent = 'Сохранить';
            });
        };

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Отмена';
        cancelBtn.className = 'modal-button';
        cancelBtn.onclick = function () {
          modal.remove();
        };

        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(saveBtn);

        form.appendChild(label);
        form.appendChild(input);

        content.appendChild(title);
        content.appendChild(message);
        content.appendChild(form);
        content.appendChild(buttonContainer);
        modal.appendChild(content);
        document.body.appendChild(modal);

        input.focus();
      });
    })
    .catch(function (error) {
      console.error('❌ Ошибка загрузки operator_login:', error);
      ModalSystem.alert('Ошибка загрузки настроек терминала');
    });
}

// Функция для показа модального окна ожидания серийного номера от Flutter
function showSerialNumberWaitingModal() {
  const modal = document.createElement('div');
  modal.id = 'serialNumberWaitingModal';
  modal.className = 'modal-overlay';

  const content = document.createElement('div');
  content.className = 'modal-content';

  const title = document.createElement('h2');
  title.textContent = 'Ожидание серийного номера';
  title.style.cssText = 'margin: 0 0 15px 0;';

  const message = document.createElement('p');
  message.textContent = 'Запрашиваем серийный номер терминала у Flutter...';
  message.style.cssText = 'margin: 0 0 15px 0; color: #666;';

  const spinner = document.createElement('div');
  spinner.className = 'payment-waiting-spinner';
  spinner.style.cssText = 'margin: 20px auto;';

  content.appendChild(title);
  content.appendChild(message);
  content.appendChild(spinner);
  modal.appendChild(content);
  document.body.appendChild(modal);

  return modal;
}

// Функция для ручного открытия настроек терминала (можно вызвать из кнопки)
function openTerminalSettings() {
  console.log('🔧 Запрос на открытие настроек терминала');

  // Защита от повторных кликов - если уже идет запрос к Flutter
  if (pendingSettingsOpen) {
    console.log('⏳ Запрос серийного номера уже выполняется, ждем ответа...');
    return;
  }

  // Пытаемся восстановить серийный номер из sessionStorage, если он потерян
  if (!terminalSerialNumber) {
    try {
      const savedSerialNumber = sessionStorage.getItem('terminalSerialNumber');
      if (savedSerialNumber) {
        console.log('📱 Восстановлен серийный номер из sessionStorage:', savedSerialNumber);
        terminalSerialNumber = savedSerialNumber;
      }
    } catch (e) {
      console.log('⚠️ Не удалось прочитать sessionStorage:', e);
    }
  }

  // Если серийный номер уже есть - сразу открываем настройки
  if (terminalSerialNumber) {
    showOperatorLoginSettings(terminalSerialNumber);
  } else {
    // Если серийного номера нет - запрашиваем его у Flutter
    console.log('📱 Запрашиваем серийный номер терминала у Flutter...');
    pendingSettingsOpen = true; // Устанавливаем флаг, чтобы открыть настройки после получения серийного номера

    // Показываем модальное окно ожидания
    const waitingModal = showSerialNumberWaitingModal();

    // Сохраняем ссылку на модальное окно для закрытия после получения ответа
    window.currentSerialNumberWaitingModal = waitingModal;

    // Вызываем метод Flutter для получения серийного номера
    if (window.flutter_inappwebview) {
      window.flutter_inappwebview.callHandler("getSerialNumber");
    } else {
      console.error('❌ window.flutter_inappwebview не доступен');
      pendingSettingsOpen = false;
      waitingModal.remove();
      ModalSystem.alert('Не удалось связаться с Flutter для получения серийного номера терминала.');
    }
  }
}

// Функция для запроса нового токена
function requestNewToken() {
  return new Promise(function (resolve, reject) {
    console.log('🚀 Отправляем запрос на получение нового токена...');
    console.log('📱 Текущее значение terminalSerialNumber:', terminalSerialNumber);

    // Проверяем наличие серийного номера
    if (!terminalSerialNumber) {
      // Пытаемся восстановить из sessionStorage
      try {
        const savedSerialNumber = sessionStorage.getItem('terminalSerialNumber');
        console.log('📱 Пытаемся восстановить из sessionStorage:', savedSerialNumber);
        if (savedSerialNumber) {
          console.log('📱 Восстановлен серийный номер из sessionStorage:', savedSerialNumber);
          terminalSerialNumber = savedSerialNumber;
        }
      } catch (e) {
        console.log('⚠️ Не удалось прочитать sessionStorage:', e);
      }
    }

    if (!terminalSerialNumber) {
      const errorMsg = 'Серийный номер терминала не получен. Пожалуйста, настройте терминал через кнопку настроек.';
      console.error('❌', errorMsg);
      console.error('❌ terminalSerialNumber =', terminalSerialNumber);
      reject(new Error(errorMsg));
      return;
    }

    console.log('✅ Используем серийный номер для запроса токена:', terminalSerialNumber);

    // Формируем данные запроса с серийным номером
    const requestData = {
      serial_number: terminalSerialNumber
    };

    console.log('📤 Отправляем запрос на get_token.php с данными:', requestData);

    fetch('get_token.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (result) {
        // Проверяем успешность запроса
        if (!result.success) {
          const errorMsg = result.message || result.error || 'Ошибка получения токена';
          console.error('❌ Ошибка от сервера:', errorMsg);

          // Если ошибка связана с operator_login - показываем специальное сообщение
          if (errorMsg.includes('operator_login') || errorMsg.includes('не настроен')) {
            reject(new Error('OPERATOR_LOGIN_NOT_CONFIGURED: ' + errorMsg));
          } else {
            reject(new Error(errorMsg));
          }
          return;
        }

        console.log('📨 Запрос на новый токен отправлен, ждем сохранения...');

        // Ждем немного, чтобы токен успел сохраниться
        setTimeout(function () {
          // Проверяем, сохранился ли новый токен через PHP endpoint
          fetch('get_token_status.php')
            .then(function (response) {
              if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': Failed to check new token status');
              }
              return response.json();
            })
            .then(function (data) {
              if (data.success && !data.isExpired) {
                console.log('✅ Новый токен успешно получен и валиден');
                console.log('⏰ Новый токен истекает через ' + data.timeLeft + ' секунд');
                resolve(data.token);
              } else {
                reject(new Error('New token is already expired or invalid'));
              }
            })
            .catch(function (error) {
              console.error('❌ Ошибка проверки нового токена:', error);
              reject(error);
            });
        }, 3000); // Ждем 3 секунды
      })
      .catch(function (error) {
        console.error('❌ Ошибка запроса нового токена:', error);
        reject(error);
      });
  });
}

// Обработчик ответа от Flutter после оплаты
window.createPaymentAfterFlutterConfirmation = function (response) {
  // Парсим ответ если он строка
  let responseData = response;
  if (typeof response === 'string') {
    try {
      responseData = JSON.parse(response);
    } catch (e) {
      console.error('❌ Ошибка парсинга JSON:', e);
      showPaymentError("Ошибка формата ответа от платежной системы");
      // Разблокируем кнопку
      if (currentWaitingPayment && currentWaitingPayment.button) {
        currentWaitingPayment.button.disabled = false;
        currentWaitingPayment.button.textContent = getTranslationSafe("accept_payment_button_terminal");
      }
      currentWaitingPayment = null;
      return;
    }
  }

  // Логируем RNN если он есть
  if (responseData && responseData.transaction &&
    responseData.transaction.instrumentSpecificData &&
    responseData.transaction.instrumentSpecificData.rrn) {
    console.log('📋 RNN от терминала: ' + responseData.transaction.instrumentSpecificData.rrn);
  } else if (responseData && responseData.result && responseData.result.RNN) {
    console.log('📋 RNN от терминала: ' + responseData.result.RNN);
  }

  // Закрываем модальное окно ожидания
  const waitingModal = document.getElementById("paymentWaitingModal");
  if (waitingModal) {
    waitingModal.remove();
  }

  // Проверяем успешность оплаты

  // Проверяем формат ошибки с полями error, errorCode, message
  if (responseData && responseData.error && responseData.errorCode !== undefined) {
    console.error("❌ Ошибка оплаты от Flutter:", responseData);
    const errorMessage = responseData.message || responseData.error || "Ошибка при выполнении оплаты";
    showPaymentError(errorMessage);
    // Разблокируем кнопку
    if (currentWaitingPayment && currentWaitingPayment.button) {
      currentWaitingPayment.button.disabled = false;
      currentWaitingPayment.button.textContent = getTranslationSafe("accept_payment_button_terminal");
    }
    // Очищаем данные ожидающего платежа
    currentWaitingPayment = null;
    return; // Не создаем платеж при ошибке
  }

  if (responseData && responseData.result && responseData.result.code === 0) {
    // Оплата успешна - создаем платеж в системе
    createPaymentInSystem(responseData);
  } else {
    // Ошибка оплаты
    console.error("❌ Ошибка оплаты:", responseData);
    const errorMessage = responseData && responseData.result ? responseData.result.description : "Ошибка оплаты";
    showPaymentError(errorMessage);
  }

  // Разблокируем кнопку (если еще не разблокирована)
  if (currentWaitingPayment && currentWaitingPayment.button) {
    currentWaitingPayment.button.disabled = false;
    currentWaitingPayment.button.textContent = getTranslationSafe("accept_payment_button_terminal");
  }

  // Очищаем данные ожидающего платежа (если еще не очищены)
  if (currentWaitingPayment) {
    currentWaitingPayment = null;
  }
};

// Функция создания платежа в системе
function createPaymentInSystem(megapayResponse) {
  if (!currentWaitingPayment || !currentWaitingPayment.paymentData) {
    console.error("❌ Нет данных о платеже");
    showPaymentError("Ошибка: данные платежа не найдены");
    return;
  }

  const paymentData = currentWaitingPayment.paymentData;

  // Получаем RNN из ответа MegaPay
  // RNN может быть в разных местах в зависимости от формата ответа
  let rnn = null;

  // Проверяем новый формат: transaction.instrumentSpecificData.rrn
  if (megapayResponse &&
    megapayResponse.transaction &&
    megapayResponse.transaction.instrumentSpecificData &&
    megapayResponse.transaction.instrumentSpecificData.rrn) {
    rnn = megapayResponse.transaction.instrumentSpecificData.rrn;
  }
  // Проверяем старый формат: result.RNN (для обратной совместимости)
  else if (megapayResponse &&
    megapayResponse.result &&
    megapayResponse.result.RNN) {
    rnn = megapayResponse.result.RNN;
  }

  if (rnn) {
    console.log("📋 RNN от терминала:", rnn);
  } else {
    console.warn("⚠️ RNN не найден в ответе от терминала");
  }

  // Формируем данные для создания платежа
  const requestData = {
    action: "processPayment",
    ls: paymentData.ls,
    service_id: paymentData.service_id,
    service: paymentData.service,
    amount: paymentData.amount,
    payment_type: paymentData.payment_type.toLowerCase() === "cash" ? "cash" : "terminal",
    date: paymentData.date,
    user_id: paymentData.user_id,
    rnn: rnn // Добавляем RNN от MegaPay
  };

  // Отправляем запрос на создание платежа
  fetch(BASE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData)
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.success) {
        // Платеж успешно создан
        showPaymentSuccess("Платеж успешно создан!");

        // Очищаем поля
        if (currentWaitingPayment && currentWaitingPayment.details) {
          const amountInput = currentWaitingPayment.details.querySelector('.amount-input');
          const serviceSelect = currentWaitingPayment.details.querySelector('.service-select');
          if (amountInput) amountInput.value = "";
          if (serviceSelect) serviceSelect.selectedIndex = 0;
        }
      } else {
        // Ошибка создания платежа
        showPaymentError(data.message || "Ошибка создания платежа");
      }
    })
    .catch(function (error) {
      console.error("❌ Ошибка создания платежа:", error);
      showPaymentError("Ошибка создания платежа: " + error.message);
    });
}

// Функция показа успеха
function showPaymentSuccess(message) {
  ModalSystem.alert(message);
}

// Функция показа ошибки
function showPaymentError(message) {
  ModalSystem.alert("Ошибка: " + message);
}

// Функция для отображения ответа Flutter в модальном окне
function showFlutterResponseModal(response) {
  // Создаем модальное окно
  const modal = document.createElement("div");
  modal.id = "flutterResponseModal";
  modal.className = "modal-overlay";

  const content = document.createElement("div");
  content.className = "modal-content flutter-response-content";
  content.style.cssText = `
    max-width: 90vw;
    max-height: 90vh;
    width: 800px;
    display: flex;
    flex-direction: column;
  `;

  const title = document.createElement("h2");
  title.textContent = "Ответ от Flutter (DEBUG)";
  title.className = "modal-message";
  title.style.cssText = "margin: 0 0 15px 0; flex-shrink: 0;";

  const responseDiv = document.createElement("div");
  responseDiv.className = "flutter-response-data";
  responseDiv.style.cssText = `
    flex: 1;
    overflow: auto;
    border: 1px solid #ddd;
    border-radius: 5px;
    background: #f9f9f9;
  `;

  // Форматируем ответ для отображения
  const formattedResponse = JSON.stringify(response, null, 2);
  const preElement = document.createElement("pre");
  preElement.style.cssText = `
    margin: 0;
    padding: 15px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-wrap: break-word;
    background: transparent;
    user-select: text;
    cursor: text;
  `;
  preElement.textContent = formattedResponse;
  responseDiv.appendChild(preElement);

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "modal-buttons";
  buttonContainer.style.cssText = "flex-shrink: 0; margin-top: 15px; display: flex; gap: 10px;";

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Копировать";
  copyBtn.className = "modal-button";
  copyBtn.style.cssText = "background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;";
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(formattedResponse).then(() => {
      copyBtn.textContent = "Скопировано!";
      copyBtn.style.background = "#28a745";
      setTimeout(() => {
        copyBtn.textContent = "Копировать";
        copyBtn.style.background = "#007bff";
      }, 2000);
    }).catch(() => {
      // Fallback для старых браузеров
      const textArea = document.createElement("textarea");
      textArea.value = formattedResponse;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      copyBtn.textContent = "Скопировано!";
      copyBtn.style.background = "#28a745";
      setTimeout(() => {
        copyBtn.textContent = "Копировать";
        copyBtn.style.background = "#007bff";
      }, 2000);
    });
  };

  const okBtn = document.createElement("button");
  okBtn.textContent = "OK";
  okBtn.className = "modal-button primary";
  okBtn.style.cssText = "background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;";
  okBtn.onclick = () => {
    modal.remove();
  };

  buttonContainer.appendChild(copyBtn);
  buttonContainer.appendChild(okBtn);
  content.appendChild(title);
  content.appendChild(responseDiv);
  content.appendChild(buttonContainer);
  modal.appendChild(content);
  document.body.appendChild(modal);

  // Фокус на кнопке копирования
  copyBtn.focus();
}

// Глобальная переменная для хранения данных ожидающего платежа
let currentWaitingPayment = null;

// Функция показа модального окна ожидания
function showPaymentWaitingModal(paymentData, button, details) {
  // Сохраняем данные для последующего использования
  currentWaitingPayment = {
    paymentData: paymentData,
    button: button,
    details: details
  };

  // Создаем модальное окно
  const modal = document.createElement("div");
  modal.id = "paymentWaitingModal";

  const content = document.createElement("div");
  content.className = "payment-waiting-content";

  const title = document.createElement("h2");
  title.textContent = getTranslationSafe("payment_waiting_title");
  title.className = "payment-waiting-title";

  const message = document.createElement("p");
  message.innerHTML = `
    <strong>Оплатите через терминал:</strong><br>
    • QR-код<br>
    • Банковскую карту<br><br>
    <strong>Сумма:</strong> ${paymentData.amount} сом<br>
    <strong>Услуга:</strong> ${paymentData.service}<br>
    <strong>Лицевой счет:</strong> ${paymentData.ls}
  `;
  message.className = "payment-waiting-message";

  const spinner = document.createElement("div");
  spinner.className = "payment-waiting-spinner";

  const statusText = document.createElement("p");
  statusText.textContent = getTranslationSafe("payment_waiting_status");
  statusText.className = "payment-waiting-status";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = getTranslationSafe("payment_waiting_cancel");
  cancelBtn.className = "button button-danger payment-waiting-cancel";
  cancelBtn.onclick = () => {
    // Отменяем платеж
    cancelWaitingPayment();
    modal.remove();
  };

  content.appendChild(title);
  content.appendChild(message);
  content.appendChild(spinner);
  content.appendChild(statusText);
  content.appendChild(cancelBtn);
  modal.appendChild(content);
  document.body.appendChild(modal);

  // Блокируем кнопку
  button.disabled = true;
  button.textContent = getTranslationSafe("payment_waiting_button");
}

// Функция отмены ожидающего платежа
function cancelWaitingPayment() {
  if (currentWaitingPayment) {
    // Разблокируем кнопку
    currentWaitingPayment.button.disabled = false;
    currentWaitingPayment.button.textContent = getTranslationSafe("accept_payment_button_terminal");

    // Очищаем данные
    currentWaitingPayment = null;

    showAlertWithKeyboardHide(getTranslationSafe("payment_cancelled"));
  }
}

// Функция успешного завершения платежа
function completeWaitingPayment() {
  if (currentWaitingPayment) {
    // Очищаем поля
    currentWaitingPayment.details.querySelector(`.amount-input`).value = "";
    currentWaitingPayment.details.querySelector(`.service-select`).selectedIndex = 0;

    // Разблокируем кнопку
    currentWaitingPayment.button.disabled = false;
    currentWaitingPayment.button.textContent = getTranslationSafe("accept_payment_button_terminal");

    // Удаляем модальное окно
    const modal = document.getElementById("paymentWaitingModal");
    if (modal) {
      modal.remove();
    }

    // Очищаем данные
    currentWaitingPayment = null;
  }
}

// Функция ошибки платежа
function errorWaitingPayment(errorMessage) {
  if (currentWaitingPayment) {
    // Разблокируем кнопку
    currentWaitingPayment.button.disabled = false;
    currentWaitingPayment.button.textContent = getTranslationSafe("accept_payment_button_terminal");

    // Удаляем модальное окно
    const modal = document.getElementById("paymentWaitingModal");
    if (modal) {
      modal.remove();
    }

    // Очищаем данные
    currentWaitingPayment = null;

    showAlertWithKeyboardHide(getTranslationSafe("payment_terminal_error") + errorMessage);
  }
}

// Делаем функцию глобальной для доступа из language.js
window.renderCurrentPageResults = function renderCurrentPageResults() {
  if (!searchResultsList) return;

  searchResultsList.innerHTML = "";
  const totalPages = Math.ceil(allFoundSubscribers.length / ITEMS_PER_PAGE);

  // Обновляем информацию о странице
  if (pageInfoSpan) {
    pageInfoSpan.textContent = `${currentPage} / ${totalPages === 0 ? 1 : totalPages}`;
  }

  // Управляем кнопками пагинации
  if (prevPageButton) prevPageButton.disabled = currentPage === 1;
  if (nextPageButton) nextPageButton.disabled = currentPage === totalPages || totalPages === 0;

  // Показываем/скрываем пагинацию
  if (allFoundSubscribers.length === 0) {
    if (paginationContainer) paginationContainer.classList.add("hidden");
    if (resultsCountSpan) resultsCountSpan.textContent = `(0 ${getTranslationSafe("results_count_found")})`;
    // resultsMessageDiv убран
    return;
  } else {
    // Показываем пагинацию только если больше 1 страницы
    if (paginationContainer) {
      if (totalPages > 1) {
        paginationContainer.classList.remove("hidden");
      } else {
        paginationContainer.classList.add("hidden");
      }
    }
    // resultsMessageDiv убран
  }

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const subscribersToRender = allFoundSubscribers.slice(startIndex, endIndex);

  if (subscribersToRender.length === 0 && allFoundSubscribers.length > 0 && currentPage > 1) {
    currentPage = totalPages;
    renderCurrentPageResults();
    return;
  }

  subscribersToRender.forEach((subscriber) => {
    const subscriberCard = document.createElement("div");
    subscriberCard.className = "subscriber-card";

    const header = document.createElement("div");
    header.className = "subscriber-header";
    header.innerHTML = `
      <span>${subscriber.account_number || getTranslationSafe("data_not_available")} &bull; ${subscriber.full_name || getTranslationSafe("data_unknown")}</span>
      <span class="toggle-icon">▶</span>
    `;
    subscriberCard.appendChild(header);

    const details = document.createElement("div");
    details.className = "subscriber-details";

    let serviceOptionsHtml = `<option value="">${getTranslationSafe("select_service")}</option>`;
    if (availableServices.length > 0) {
      availableServices.forEach((service) => {
        serviceOptionsHtml += `<option value="${service.id}">${service.name}</option>`;
      });
    } else {
      serviceOptionsHtml += `<option value="" disabled>Услуги не найдены</option>`;
    }

    details.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">${getTranslationSafe("ls_label")}</span>
        <span class="detail-value">${subscriber.account_number || getTranslationSafe("data_not_available")}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${getTranslationSafe("fio_label")}</span>
        <span class="detail-value">${subscriber.full_name || getTranslationSafe("data_not_available")}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${getTranslationSafe("locality_label")}</span>
        <span class="detail-value">${subscriber.locality || getTranslationSafe("data_not_available")}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${getTranslationSafe("street_label")}</span>
        <span class="detail-value">${subscriber.street || getTranslationSafe("data_not_available")}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${getTranslationSafe("house_label")}</span>
        <span class="detail-value">${subscriber.house || getTranslationSafe("data_not_available")}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${getTranslationSafe("flat_label")}</span>
        <span class="detail-value">${subscriber.flat || getTranslationSafe("data_not_available")}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${getTranslationSafe("balance_label")}</span>
        <span class="detail-value ${subscriber.balance && parseFloat(subscriber.balance) < 0 ? 'negative-balance' : ''}">${subscriber.balance || getTranslationSafe("data_not_available")}</span>
      </div>
      <div class="service-section">
        <select id="service-${subscriber.account_number}" class="service-select" name="service">
          ${serviceOptionsHtml}
        </select>
        <input type="number" id="amount-${subscriber.account_number
      }" class="amount-input" name="amount" placeholder="${getTranslationSafe("enter_amount")}" step="0.01" min="0">
        <div class="button-group">
          <button type="button" class="button pay-button" data-payment-type="cash">
            💵 ${getTranslationSafe("accept_payment_button_cash")}
          </button>
          <button type="button" class="button pay-button" data-payment-type="terminal">
            💳 ${getTranslationSafe("accept_payment_button_terminal")}
          </button>
        </div>
      </div>
    `;
    subscriberCard.appendChild(details);

    header.addEventListener("click", () => {
      subscriberCard.classList.toggle("active");
      // Стили применяются через CSS класс .subscriber-card.active
      const icon = header.querySelector(".toggle-icon");
      icon.textContent = subscriberCard.classList.contains("active") ? "▼" : "▶";
    });

    const payButtons = details.querySelectorAll(".pay-button");
    payButtons.forEach((button) => {
      button.addEventListener("click", async (e) => {
        const selectedServiceId = details.querySelector(`.service-select`).value;
        const enteredAmount = parseFloat(details.querySelector(`.amount-input`).value);
        const paymentType = e.target.dataset.paymentType;
        const serviceName = details.querySelector(`.service-select`).options[details.querySelector(`.service-select`).selectedIndex].text;
        const controllerName = controllerNameDisplay ? controllerNameDisplay.textContent.trim() : "";

        if (!selectedServiceId) {
          showAlertWithKeyboardHide(getTranslationSafe("validation_select_service"));
          return;
        }
        if (isNaN(enteredAmount) || enteredAmount <= 0) {
          showAlertWithKeyboardHide(getTranslationSafe("validation_enter_amount"));
          return;
        }

        // Блокируем кнопку
        button.disabled = true;
        button.textContent = getTranslationSafe("payment_processing_button");

        try {
          // Определяем тип платежа для Flutter
          const flutterPaymentType = paymentType === "cash" ? "CASH" : "CARD";

          // Создаем данные платежа (общие для всех типов платежей)
          const finalUserId = controllerNameDisplay ? controllerNameDisplay.getAttribute('data-user-id') || '1' : '1';
          const today = new Date();
          const year = today.getFullYear();
          const month = today.getMonth() + 1;
          const day = today.getDate();
          const currentDate = year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);

          const paymentData = {
            action: "processPayment",
            ls: subscriber.account_number,
            service_id: selectedServiceId,
            service: serviceName,
            amount: enteredAmount,
            payment_type: flutterPaymentType,
            date: currentDate,
            controllerName: controllerName,
            user_id: finalUserId,
            vat_value: vat_value, // НДС (Налог на добавленную стоимость)
            st_value: st_value  // НСП (Налог с продаж)
          };

          // Для терминальных платежей сначала получаем серийный номер, потом проверяем operator_login в БД
          if (flutterPaymentType === "CARD") {
            console.log('💳 Нажата кнопка оплаты через терминал (CARD)');
            console.log('📋 Данные платежа подготовлены:', paymentData);

            // Всегда запрашиваем серийный номер у Flutter для проверки в БД
            if (window.flutter_inappwebview) {
              // Сохраняем данные платежа для продолжения после получения серийного номера
              pendingPaymentAfterSerialNumber = {
                paymentData: paymentData,
                button: button,
                details: details,
                flutterPaymentType: flutterPaymentType
              };

              console.log('📱 Запрашиваем серийный номер терминала у Flutter...');
              // Запрашиваем серийный номер у Flutter
              window.flutter_inappwebview.callHandler("getSerialNumber");

              return; // Прерываем выполнение, продолжим после получения серийного номера
            } else {
              console.error('❌ Flutter недоступен');
              button.disabled = false;
              button.textContent = getTranslationSafe("accept_payment_button_terminal");
              return; // Прерываем выполнение
            }
          }

          // Для наличных платежей не нужен токен - сразу отправляем в Flutter
          if (flutterPaymentType === "CASH") {
            console.log('💰 Наличный платеж - отправляем без токена');
            sendPaymentToFlutter(paymentData, button, details, flutterPaymentType);
          } else {
            // Для карточных платежей получаем токен
            console.log('💳 Карточный платеж - запрашиваем токен');
            getValidToken()
              .then(token => {
                // Добавляем токен к данным платежа
                paymentData.megapay_token = token;

                // Отправляем данные в Flutter
                sendPaymentToFlutter(paymentData, button, details, flutterPaymentType);
              })
              .catch(error => {
                console.error("❌ Ошибка получения токена:", error);
                button.disabled = false;
                button.textContent = getTranslationSafe("accept_payment_button_terminal");

                // Проверяем тип ошибки
                const errorMessage = error.message || error.toString();

                if (errorMessage.includes('OPERATOR_LOGIN_NOT_CONFIGURED') ||
                  errorMessage.includes('не настроен') ||
                  errorMessage.includes('operator_login')) {
                  // Если operator_login не настроен - показываем простое сообщение
                  const message = errorMessage.includes('OPERATOR_LOGIN_NOT_CONFIGURED')
                    ? errorMessage.replace('OPERATOR_LOGIN_NOT_CONFIGURED: ', '')
                    : 'Для данного терминала не настроен operator_login.';
                  showAlertWithKeyboardHide(message);
                } else if (errorMessage.includes('Серийный номер терминала не получен')) {
                  // Если серийный номер не получен - показываем простое сообщение
                  showAlertWithKeyboardHide(errorMessage);
                } else {
                  // Другие ошибки
                  showAlertWithKeyboardHide(errorMessage || "Ошибка получения токена авторизации. Попробуйте позже.");
                }
              });
          }
        } catch (error) {
          console.error("Ошибка сети:", error);
          showAlertWithKeyboardHide(getTranslationSafe("payment_network_error"));
        } finally {
          // Кнопка разблокируется в модальном окне при получении результата от Flutter
          // Здесь не разблокируем, так как оба типа платежей отправляются во Flutter
        }
      });
    });

    searchResultsList.appendChild(subscriberCard);
  });

  // Автоматически открываем карточку, если найден только один абонент
  if (subscribersToRender.length === 1) {
    const singleCard = searchResultsList.querySelector('.subscriber-card');
    if (singleCard) {
      singleCard.classList.add('active');
      const icon = singleCard.querySelector('.toggle-icon');
      if (icon) {
        icon.textContent = '▼';
      }
    }
  }
}

if (prevPageButton) {
  prevPageButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderCurrentPageResults();
    }
  });
}

if (nextPageButton) {
  nextPageButton.addEventListener("click", () => {
    const totalPages = Math.ceil(allFoundSubscribers.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) {
      currentPage++;
      renderCurrentPageResults();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Инициализируем элементы после загрузки DOM
  controllerNameDisplay = document.getElementById("controllerNameDisplay");

  // Сбрасываем селект муниципального предприятия в пустое состояние
  const municipalSelect = document.getElementById("searchMunicipalEnterprise");
  if (municipalSelect) {
    municipalSelect.selectedIndex = -1; // Ничего не выбрано
    municipalSelect.setAttribute('data-selected', 'false');

    // Добавляем обработчик изменения селекта
    municipalSelect.addEventListener('change', () => {
      if (municipalSelect.selectedIndex >= 0) {
        municipalSelect.setAttribute('data-selected', 'true');
      } else {
        municipalSelect.setAttribute('data-selected', 'false');
      }
    });
  }

  // Отключаем стандартную валидацию формы
  const searchForm = document.getElementById("searchForm");
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Предотвращаем стандартную отправку формы
      // Наша логика поиска уже обрабатывается в отдельном обработчике
    });
  }

  checkPhoneAuth();

  // Обработчик кнопки настроек терминала (в экране логина)
  const terminalSettingsButtonLogin = document.getElementById("terminalSettingsButtonLogin");
  if (terminalSettingsButtonLogin) {
    terminalSettingsButtonLogin.addEventListener("click", function () {
      openTerminalSettings();
    });
  }
});
