// Конфигурация приложения
const CONFIG = {
    // Базовый URL API
    BASE_API_URL: "https://jyluuluk.billing.mycloud.kg/controllers/cotroller.php",

    // URL для проверки пароля (legacy)
    CHECK_PASS_URL: "../checkPass.php",

    // Настройки пагинации
    ITEMS_PER_PAGE: 10,

    // Настройки модальных окон
    MODAL_Z_INDEX: 10001,

    // Настройки клавиатуры (мобильные)
    KEYBOARD_HIDE_DELAY: 200,
    MODAL_SHOW_DELAY: 100
};

// Экспортируем конфигурацию
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
