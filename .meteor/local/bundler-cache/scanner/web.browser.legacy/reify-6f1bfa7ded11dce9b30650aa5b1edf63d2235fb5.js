'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./react-spring-core.cjs.prod.js");
} else {
  module.exports = require("./react-spring-core.cjs.dev.js");
}
