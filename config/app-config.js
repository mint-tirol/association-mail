const dotenv = require('dotenv'); // instatiate environment variables

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: envFile });

const CONFIG = {}; // Make this global to use all over the application

CONFIG.email_password = process.env.EMAIL_PASSWORD;
CONFIG.email_user = process.env.EMAIL_USER;
CONFIG.email_smtp = process.env.email_smtp;
CONFIG.email_port = process.env.EMAIL_PORT;
CONFIG.email_secure = process.env.EMAIL_SECURE;

module.exports = CONFIG;
