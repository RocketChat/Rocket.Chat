'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./emotion-hash.cjs.prod.js");
} else {
  module.exports = require("./emotion-hash.cjs.dev.js");
}
