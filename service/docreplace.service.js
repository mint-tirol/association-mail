const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const fs = require('fs');
const path = require('path');

let content = null;

function loadtemplate(templateFile) {
  return new Promise((resolve) => {
    content = fs.readFileSync(
      templateFile,
      'binary',
    );
    resolve();
  });
}

module.exports.loadtemplate = loadtemplate;

function render(payload, outputFileName) {
  return new Promise((resolve, reject) => {
    try {
      // Load the docx file as binary content
      if (!content) reject(new Error('No Template loaded'));

      const zip = new PizZip(content);

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Render the document (Replace {first_name} by John, {last_name} by Doe, ...)
      doc.render(payload);

      const buf = doc.getZip().generate({
        type: 'nodebuffer',
        // compression: DEFLATE adds a compression step.
        // For a 50MB output document, expect 500ms additional CPU time
        compression: 'DEFLATE',
      });

      // buf is a nodejs Buffer, you can either write it to a
      // file or res.send it with express for example.
      fs.writeFileSync(path.resolve(__dirname, '..', 'tmp', outputFileName), buf);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports.render = render;
