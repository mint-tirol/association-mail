const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const CONFIG = require('../config/app-config');
const logger = require('./logger.service');

const mailConfig = {
  host: CONFIG.email_smtp,
  port: CONFIG.email_port,
  secure: CONFIG.email_secure, // true for 465, false for other ports
  auth: {
    user: CONFIG.email_user, // generated ethereal user
    pass: CONFIG.email_password, // generated ethereal password
  },
};

const transporter = nodemailer.createTransport(mailConfig);

function sendNewsletter({
  newsletterfileName, email, subject, payload, attachments,
}) {
  return new Promise((resolve) => {
    fs.readFile(
      path.join(__dirname, '/../template/', newsletterfileName),
      { encoding: 'utf-8' },
      async (err, html) => {
        if (err) {
          logger.error(err);
          return;
        }

        const mailOptions = {
          from: '"MINT Oberland 💌" <info@mint.tirol>', // sender address
          to: email, // list of receivers
          subject, // Subject line
          text: 'Automatisch generietes Email', // plain text body
          html: '', // html body
          attachments,
        };

        const template = handlebars.compile(html);
        const replacements = {
          name: payload.name,
          message: payload.message,
          userId: payload.userId,
        };

        const htmlToSend = template(replacements);
        mailOptions.html = htmlToSend;

        // eslint-disable-next-line no-unused-vars
        await transporter.sendMail(mailOptions);
        resolve();
      },
    );
  });
}

module.exports.sendNewsletter = sendNewsletter;
