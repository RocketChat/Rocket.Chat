'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./react-spring-web.cjs.prod.js");
} else {
  module.exports = require("./react-spring-web.cjs.dev.js");
}
