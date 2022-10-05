const chalk = require('chalk');

let instance;
const logLevels = ['error', 'warn', 'info', 'log', 'debug'];
class Logger {
  constructor(transports = []) {
    if (!instance) {
      this.transports = transports;
      instance = this;
    }
    // eslint-disable-next-line no-constructor-return
    return instance;
  }

  init({ VERBOSE_LEVEL, namespace }) {
    try {
      this.logLevel = logLevels[VERBOSE_LEVEL];
      this.namespace = namespace;
    } catch (e) {
      this.error(e);
    }
  }

  shouldLog(method) {
    const appLogLevel = logLevels.findIndex((f) => f === this.logLevel);
    const methodLogLevel = logLevels.findIndex((f) => f === method);
    return methodLogLevel <= appLogLevel;
  }

  send(method, ...args) {
    try {
      if (this.shouldLog(method)) {
        this.transports.forEach((t) => {
          t[method](...args);
        });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }

  sendWithoutCheck(method, ...args) {
    try {
      this.transports.forEach((t) => {
        t[method](...args);
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }

  log(...args) {
    return this.send('log', ...args);
  }

  error(...args) {
    return this.send('error', ...args);
  }

  warn(...args) {
    return this.send('warn', ...args);
  }

  info(...args) {
    return this.send('info', ...args);
  }

  debug(...args) {
    return this.send('debug', ...args);
  }

  always(...args) {
    return this.sendWithoutCheck('log', ...args);
  }

  // eslint-disable-next-line class-methods-use-this
  service(...args) {
    let msg = args.join(' ');
    const size = process.stdout.columns < 80 ? process.stdout.columns : 80;
    msg += Array(size + 1).join(' ');
    msg = msg.substring(0, size);
    process.stdout.write(msg);
  }

  // eslint-disable-next-line class-methods-use-this
  success() {
    // eslint-disable-next-line no-console
    console.log(chalk.green('[+]'));
  }

  // eslint-disable-next-line class-methods-use-this
  fail() {
    // eslint-disable-next-line no-console
    console.log(chalk.red('[-]'));
  }
}
const transports = [console];

module.exports = new Logger(transports);
