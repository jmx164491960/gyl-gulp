#!/usr/bin/env node

console.log('gyl');
const process = require('process');
const path = require('path');

process.argv.push(
  '--gulpfile',
  // __dirname是全局变量，表示当前文件所在目录
  path.resolve(__dirname, './gulpfile.js')
);


process.env.ENTRY_PATH = `F:\\project\\SCM\\product_module`;

const gulpPath = path.join(`D:/NodeJS/node_global/node_modules/` + `gulp-cli/bin/gulp`);
require(gulpPath);