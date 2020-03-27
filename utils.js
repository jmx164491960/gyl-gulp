const path = require('path');

module.exports = {
  getPath(dir) {
    return path.join(process.env.ENTRY_PATH, dir);
  }
}