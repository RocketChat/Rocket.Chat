"use strict";

exports.__esModule = true;
exports.getLogger = getLogger;
exports.setLogger = setLogger;
// TYPES
// FUNCTIONS
var logger = console;

function getLogger() {
  return logger;
}

function setLogger(newLogger) {
  logger = newLogger;
}