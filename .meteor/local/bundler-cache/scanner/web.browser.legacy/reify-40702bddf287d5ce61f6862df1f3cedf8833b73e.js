'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./react-spring-shared.cjs.prod.js");
} else {
  module.exports = require("./react-spring-shared.cjs.dev.js");
}
