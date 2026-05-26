const IS_PRODUCTION = false;

window.APP_CONFIG = {
    BACKEND_URL: IS_PRODUCTION
        ? 'https://your-spring-boot-app.onrender.com'
        : 'http://localhost:8080'
};