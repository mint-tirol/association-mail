/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
const path = require('path');
const Excel = require('exceljs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const mailservice = require('./service/email.service');
const docreplace = require('./service/docreplace.service');
const doctopdf = require('./service/doctopdf.service');
const logger = require('./service/logger.service');

const startRow = 4;

const setVerboseLevel = (argv) => {
  logger.init({ VERBOSE_LEVEL: argv.verbose, namespace: 'main' });
  return {};
};

function formatDate(date) {
  const d = new Date(date);
  let month = `${d.getMonth() + 1}`;
  let day = `${d.getDate()}`;
  const year = d.getFullYear();

  if (month.length < 2) month = `0${month}`;
  if (day.length < 2) day = `0${day}`;

  return [day, month, year].join('.');
}

function getValue(value) {
  if (value === undefined || value === null) {
    return null;
  }
  if (Object.prototype.hasOwnProperty.call(value, 'result')) {
    return value.result;
  }
  if (Object.prototype.hasOwnProperty.call(value, 'text')) {
    return value.text;
  }
  return value;
}

async function sendWelcome(argv) {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(argv.xlsxFile);
  const worksheet = workbook.getWorksheet('Stammdaten');

  for (let index = startRow; index < 1000; index += 1) {
    const id = getValue(worksheet.getRow(index).getCell(1).value);
    if (!id || id === '') {
      return;
    }
    const alreadySend = getValue(worksheet.getRow(index).getCell(13).value);
    if (alreadySend === 'x') {
      continue;
    }

    const name = getValue(worksheet.getRow(index).getCell(6).value);
    const email = getValue(worksheet.getRow(index).getCell(11).value);
    logger.service('send to: ', id, name, email);

    if (id && name && email) {
      await mailservice.sendNewsletter(
        {
          newsletterfileName: '01_Willkommen.html',
          email,
          subject: 'Willkommen bei Mint',
          payload: {
            name,
            message: '',
            userId: id,
          },
        },
      );
      logger.success();
    } else {
      logger.fail();
    }
    worksheet.getRow(index).getCell(13).value = 'x';
    await workbook.xlsx.writeFile(argv.xlsxFile);
  }
}

async function sendTestmail(argv) {
  if (argv.message && argv.template && argv.email && argv.name && argv.subject) {
    await mailservice.sendNewsletter(
      {
        newsletterfileName: argv.template,
        email: argv.email,
        subject: argv.subject,
        payload: {
          name: argv.name,
          message: argv.message,
        },
      },
    );
  }
}

async function sendNewsletter(argv) {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(argv.xlsxFile);
  const worksheet = workbook.getWorksheet('Stammdaten');

  for (let index = startRow; index < 1000; index += 1) {
    const id = getValue(worksheet.getRow(index).getCell(1).value);
    if (!id || id === '') {
      return;
    }
    const newsletterActive = getValue(worksheet.getRow(index).getCell(14).value);
    if (newsletterActive !== 'x') {
      continue;
    }

    const name = getValue(worksheet.getRow(index).getCell(6).value);
    const email = getValue(worksheet.getRow(index).getCell(11).value);
    logger.service('send to: ', id, name, email);

    if (id && name && email) {
      await mailservice.sendNewsletter(
        {
          newsletterfileName: argv.template,
          email,
          subject: argv.subject,
          payload: {
            name,
            message: argv.message,
            userId: id,
          },
        },

      );
      logger.success();
    } else {
      logger.fail();
    }
  }
}

async function sendMail(argv) {
  logger.debug('Start sendMail');

  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(argv.xlsxFile);
  const worksheet = workbook.getWorksheet('Stammdaten');

  for (let index = startRow; index < 1000; index += 1) {
    let name;
    let address;
    let place;
    let email;
    let memberActive;
    let id;

    try {
      id = getValue(worksheet.getRow(index).getCell(1).value);
      if (!id) {
        return;
      }

      if (argv.id && argv.id !== +id) {
        continue;
      }

      if (argv.all !== true) {
        logger.debug('Send only if Newsletter is active');
        const newsletterActive = getValue(worksheet.getRow(index).getCell(14).value);
        if (newsletterActive !== 'x') {
          continue;
        }
      } else {
        logger.debug('Send to all active member');
      }

      name = getValue(worksheet.getRow(index).getCell(6).value);
      address = getValue(worksheet.getRow(index).getCell(8).value);
      place = getValue(worksheet.getRow(index).getCell(9).value);
      email = getValue(worksheet.getRow(index).getCell(11).value);
      memberActive = getValue(worksheet.getRow(index).getCell(7).value);

      if (memberActive !== 'Aktiv') {
        logger.debug(`Member ${name} inactive`);
        continue;
      }

      await docreplace.loadtemplate(argv.docx);
      const extension = path.extname(argv.docx);
      const fileTemplateName = path.basename(argv.docx, extension);

      if (id && name && email && address && place) {
        logger.service('replace template for: ', (`0000${id}`).slice(-4), ' ', name, email);

        const today = (new Date());
        const expire = (new Date()).setDate(today.getDate() + 31);

        await docreplace.render({
          name,
          address,
          place,
          id: (`0000${id}`).slice(-4),
          year: today.getFullYear(),
          date: formatDate(today),
          expire: formatDate(expire),
        }, `${id}_${name}.docx`);
        logger.success();

        logger.service('render pdf for:       ', (`0000${id}`).slice(-4), ' ', name, email);
        const pathToPdf = await doctopdf.render(`${id}_${name}.docx`);
        logger.success();

        logger.service('send mail:            ', (`0000${id}`).slice(-4), ' ', name, email);
        // newsletterfileName, email, subject, payload, attachment
        await mailservice.sendNewsletter(
          {
            newsletterfileName: argv.template,
            email,
            subject: argv.subject,
            payload: {
              name,
              message: argv.message,
              userId: id,
              year: today.getFullYear(),
            },
            attachments: [{
              filename: `${fileTemplateName}.pdf`,
              path: pathToPdf,
              contentType: 'application/pdf',
            }],
          },
        );
        logger.success();
      }
    } catch (e) {
      logger.fail();
      logger.error('replace template pdf for: ', id, name, email, e);
    }
  }
}
function main() {
  console.log('ENV: ', process.env.NODE_ENV);

  // eslint-disable-next-line no-unused-expressions
  yargs(hideBin(process.argv))
    .usage('Usage: $0 <command> [options]')
    .middleware(setVerboseLevel)
    .command('welcome', 'send welcome email', () => {}, (argv) => {
      sendWelcome(argv);
    })
    .command('testmail', 'send test email', (argv) => argv
      .option('template', {
        alias: 't',
        describe: 'template name',
        default: '00_Message.html',
      })
      .option('name', {
        alias: 'n',
        describe: 'Name',
      })
      .option('message', {
        alias: 'm',
        describe: 'Message',
      })
      .option('subject', {
        describe: 'Subject',
      })
      .option('email', {
        alias: 'e',
        describe: 'Email',
      }), (argv) => { sendTestmail(argv); })
    .command('newsletter', 'send newsletter email', (argv) => argv
      .option('template', {
        alias: 't',
        describe: 'template name',
        default: '00_Message.html',
      })
      .option('name', {
        alias: 'n',
        describe: 'Name',
      })
      .option('message', {
        alias: 'm',
        describe: 'Message',
      })
      .option('subject', {
        describe: 'Subject',
      })
      .option('email', {
        alias: 'e',
        describe: 'Email',
      }), (argv) => { sendNewsletter(argv); })
    .command('mail', 'send email with attachmend', (args) => args
      .option('template', {
        alias: 't',
        describe: 'template name',
        default: '00_Message.html',
      })
      .option('message', {
        alias: 'm',
        describe: 'Message',
      })
      .option('docx', {
        alias: 'd',
        describe: 'Doc Template',
      })
      .option('subject', {
        describe: 'Subject',
      })
      .option('id', {
        describe: 'User ID',
        type: 'number',
      })
      .option('all', {
        alias: 'a',
        type: 'boolean',
        describe: 'Send to all',
      }), (argv) => { sendMail(argv); })
    .option('xlsxFile', {
      alias: 'f',
      type: 'string',
      required: true,
      description: 'Stammdaten file',
    })
    .count('verbose')
    .alias('v', 'verbose')
    .describe('v', 'Run with verbose logging')
    .showHelpOnFail(true)
    .demandCommand(1, '')
    .help('h')
    .alias('h', 'help')
    .epilog('copyright 2019')
    .argv;
}

main();
