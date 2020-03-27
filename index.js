#!/usr/bin/env node

const process = require('process');
const path = require('path');

process.argv.push(
  '--gulpfile',
  // __dirname是全局变量，表示当前文件所在目录
  path.resolve(__dirname, './gulpfile.js')
);

process.env.ENTRY_PATH = process.cwd();
const gulpPath = path.join(__dirname, `../gulp-cli/node_modules/` + `gulp-cli/bin/gulp`);

try {
  require('gulp/bin/gulp');
} catch(e) {
  console.log('请确保安装了gulp-cli');
}