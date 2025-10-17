// Пример конфигурации приложения
// Скопируйте этот файл в config.js и настройте под ваши нужды

const CONFIG = {
    // Базовый URL API - замените на ваш URL
    BASE_API_URL: "https://your-domain.com/controllers/cotroller.php",
    // Или используйте относительный путь для локальной разработки:
    // BASE_API_URL: "./cotroller.php",

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
