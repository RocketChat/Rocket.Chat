"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ReportNamespaces = exports.I18nContext = void 0;
exports.composeInitialProps = composeInitialProps;
Object.defineProperty(exports, "getDefaults", {
  enumerable: true,
  get: function () {
    return _defaults.getDefaults;
  }
});
Object.defineProperty(exports, "getI18n", {
  enumerable: true,
  get: function () {
    return _i18nInstance.getI18n;
  }
});
exports.getInitialProps = getInitialProps;
Object.defineProperty(exports, "initReactI18next", {
  enumerable: true,
  get: function () {
    return _initReactI18next.initReactI18next;
  }
});
Object.defineProperty(exports, "setDefaults", {
  enumerable: true,
  get: function () {
    return _defaults.setDefaults;
  }
});
Object.defineProperty(exports, "setI18n", {
  enumerable: true,
  get: function () {
    return _i18nInstance.setI18n;
  }
});
var _react = require("react");
var _defaults = require("./defaults.js");
var _i18nInstance = require("./i18nInstance.js");
var _initReactI18next = require("./initReactI18next.js");
const I18nContext = (0, _react.createContext)();
exports.I18nContext = I18nContext;
class ReportNamespaces {
  constructor() {
    this.usedNamespaces = {};
  }
  addUsedNamespaces(namespaces) {
    namespaces.forEach(ns => {
      if (!this.usedNamespaces[ns]) this.usedNamespaces[ns] = true;
    });
  }
  getUsedNamespaces() {
    return Object.keys(this.usedNamespaces);
  }
}
exports.ReportNamespaces = ReportNamespaces;
function composeInitialProps(ForComponent) {
  return ctx => new Promise(resolve => {
    const i18nInitialProps = getInitialProps();
    if (ForComponent.getInitialProps) {
      ForComponent.getInitialProps(ctx).then(componentsInitialProps => {
        resolve({
          ...componentsInitialProps,
          ...i18nInitialProps
        });
      });
    } else {
      resolve(i18nInitialProps);
    }
  });
}
function getInitialProps() {
  const i18n = (0, _i18nInstance.getI18n)();
  const namespaces = i18n.reportNamespaces ? i18n.reportNamespaces.getUsedNamespaces() : [];
  const ret = {};
  const initialI18nStore = {};
  i18n.languages.forEach(l => {
    initialI18nStore[l] = {};
    namespaces.forEach(ns => {
      initialI18nStore[l][ns] = i18n.getResourceBundle(l, ns) || {};
    });
  });
  ret.initialI18nStore = initialI18nStore;
  ret.initialLanguage = i18n.language;
  return ret;
}