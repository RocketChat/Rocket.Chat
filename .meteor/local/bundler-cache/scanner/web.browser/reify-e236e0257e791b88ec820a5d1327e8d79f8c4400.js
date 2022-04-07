(function() {
  var isWindows, posix, win32;

  win32 = require('./win');

  posix = require('./posix');

  isWindows = win32.isWindows;

  module.exports = isWindows ? win32 : posix;

  module.exports.posix = posix;

  module.exports.win32 = win32;

}).call(this);

//# sourceMappingURL=index.js.map
