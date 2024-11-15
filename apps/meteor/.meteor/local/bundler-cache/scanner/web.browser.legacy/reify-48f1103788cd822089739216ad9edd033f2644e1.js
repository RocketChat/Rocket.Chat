"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Translation = Translation;
var _useTranslation = require("./useTranslation.js");
function Translation(props) {
  const {
    ns,
    children,
    ...options
  } = props;
  const [t, i18n, ready] = (0, _useTranslation.useTranslation)(ns, options);
  return children(t, {
    i18n,
    lng: i18n.language
  }, ready);
}