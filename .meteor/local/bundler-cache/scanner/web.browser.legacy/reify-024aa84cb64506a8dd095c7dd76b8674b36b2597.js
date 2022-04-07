'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./react-spring-animated.cjs.prod.js");
} else {
  module.exports = require("./react-spring-animated.cjs.dev.js");
}
