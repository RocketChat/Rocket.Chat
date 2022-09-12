(function() {
  'use strict';
  var Path, PosixPath, inherits;

  inherits = require('inherits-ex');

  Path = require('../path');

  PosixPath = (function() {
    inherits(PosixPath, Path);

    function PosixPath() {
      PosixPath.__super__.constructor.call(this);
    }

    PosixPath.prototype.cwd = function() {
      return process.cwd();
    };

    return PosixPath;

  })();

  module.exports = new PosixPath;

}).call(this);

//# sourceMappingURL=index.js.map
