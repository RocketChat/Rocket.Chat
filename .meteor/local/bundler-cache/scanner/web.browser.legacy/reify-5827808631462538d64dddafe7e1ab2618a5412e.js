'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./react-spring-rafz.cjs.prod.js");
} else {
  module.exports = require("./react-spring-rafz.cjs.dev.js");
}
