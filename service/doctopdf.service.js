const { convertWordFiles } = require('convert-multiple-files');
const path = require('path');

function render(input) {
  return convertWordFiles(path.resolve(__dirname, '..', 'tmp', input), 'pdf', path.resolve(__dirname, '..', 'tmp'));
}

module.exports.render = render;
