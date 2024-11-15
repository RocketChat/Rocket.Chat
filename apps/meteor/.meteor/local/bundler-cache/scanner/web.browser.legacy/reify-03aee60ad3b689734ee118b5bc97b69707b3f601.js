"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withSSR = withSSR;
var _react = require("react");
var _useSSR = require("./useSSR.js");
var _context = require("./context.js");
var _utils = require("./utils.js");
function withSSR() {
  return function Extend(WrappedComponent) {
    function I18nextWithSSR(_ref) {
      let {
        initialI18nStore,
        initialLanguage,
        ...rest
      } = _ref;
      (0, _useSSR.useSSR)(initialI18nStore, initialLanguage);
      return (0, _react.createElement)(WrappedComponent, {
        ...rest
      });
    }
    I18nextWithSSR.getInitialProps = (0, _context.composeInitialProps)(WrappedComponent);
    I18nextWithSSR.displayName = `withI18nextSSR(${(0, _utils.getDisplayName)(WrappedComponent)})`;
    I18nextWithSSR.WrappedComponent = WrappedComponent;
    return I18nextWithSSR;
  };
}