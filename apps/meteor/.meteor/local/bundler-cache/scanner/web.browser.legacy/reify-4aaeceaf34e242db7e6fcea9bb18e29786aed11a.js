"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withTranslation = withTranslation;
var _react = require("react");
var _useTranslation = require("./useTranslation.js");
var _utils = require("./utils.js");
function withTranslation(ns) {
  let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return function Extend(WrappedComponent) {
    function I18nextWithTranslation(_ref) {
      let {
        forwardedRef,
        ...rest
      } = _ref;
      const [t, i18n, ready] = (0, _useTranslation.useTranslation)(ns, {
        ...rest,
        keyPrefix: options.keyPrefix
      });
      const passDownProps = {
        ...rest,
        t,
        i18n,
        tReady: ready
      };
      if (options.withRef && forwardedRef) {
        passDownProps.ref = forwardedRef;
      } else if (!options.withRef && forwardedRef) {
        passDownProps.forwardedRef = forwardedRef;
      }
      return (0, _react.createElement)(WrappedComponent, passDownProps);
    }
    I18nextWithTranslation.displayName = `withI18nextTranslation(${(0, _utils.getDisplayName)(WrappedComponent)})`;
    I18nextWithTranslation.WrappedComponent = WrappedComponent;
    const forwardRef = (props, ref) => (0, _react.createElement)(I18nextWithTranslation, Object.assign({}, props, {
      forwardedRef: ref
    }));
    return options.withRef ? (0, _react.forwardRef)(forwardRef) : I18nextWithTranslation;
  };
}