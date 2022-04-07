"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.QueryErrorResetBoundary = exports.useQueryErrorResetBoundary = void 0;

var _react = _interopRequireDefault(require("react"));

function createValue() {
  var _isReset = false;
  return {
    clearReset: function clearReset() {
      _isReset = false;
    },
    reset: function reset() {
      _isReset = true;
    },
    isReset: function isReset() {
      return _isReset;
    }
  };
}

var QueryErrorResetBoundaryContext = /*#__PURE__*/_react.default.createContext(createValue()); // HOOK


var useQueryErrorResetBoundary = function useQueryErrorResetBoundary() {
  return _react.default.useContext(QueryErrorResetBoundaryContext);
}; // COMPONENT


exports.useQueryErrorResetBoundary = useQueryErrorResetBoundary;

var QueryErrorResetBoundary = function QueryErrorResetBoundary(_ref) {
  var children = _ref.children;

  var value = _react.default.useMemo(function () {
    return createValue();
  }, []);

  return /*#__PURE__*/_react.default.createElement(QueryErrorResetBoundaryContext.Provider, {
    value: value
  }, typeof children === 'function' ? children(value) : children);
};

exports.QueryErrorResetBoundary = QueryErrorResetBoundary;