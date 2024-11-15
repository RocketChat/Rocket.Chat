"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDefaults = getDefaults;
exports.setDefaults = setDefaults;
var _unescape = require("./unescape.js");
let defaultOptions = {
  bindI18n: 'languageChanged',
  bindI18nStore: '',
  transEmptyNodeValue: '',
  transSupportBasicHtmlNodes: true,
  transWrapTextNodes: '',
  transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
  useSuspense: true,
  unescape: _unescape.unescape
};
function setDefaults() {
  let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  defaultOptions = {
    ...defaultOptions,
    ...options
  };
}
function getDefaults() {
  return defaultOptions;
}