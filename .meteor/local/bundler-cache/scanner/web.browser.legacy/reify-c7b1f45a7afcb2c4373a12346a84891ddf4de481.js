"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.QueryClientProvider = exports.useQueryClient = void 0;

var _react = _interopRequireDefault(require("react"));

var defaultContext = /*#__PURE__*/_react.default.createContext(undefined);

var QueryClientSharingContext = /*#__PURE__*/_react.default.createContext(false); // if contextSharing is on, we share the first and at least one
// instance of the context across the window
// to ensure that if React Query is used across
// different bundles or microfrontends they will
// all use the same **instance** of context, regardless
// of module scoping.


function getQueryClientContext(contextSharing) {
  if (contextSharing && typeof window !== 'undefined') {
    if (!window.ReactQueryClientContext) {
      window.ReactQueryClientContext = defaultContext;
    }

    return window.ReactQueryClientContext;
  }

  return defaultContext;
}

var useQueryClient = function useQueryClient() {
  var queryClient = _react.default.useContext(getQueryClientContext(_react.default.useContext(QueryClientSharingContext)));

  if (!queryClient) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one');
  }

  return queryClient;
};

exports.useQueryClient = useQueryClient;

var QueryClientProvider = function QueryClientProvider(_ref) {
  var client = _ref.client,
      _ref$contextSharing = _ref.contextSharing,
      contextSharing = _ref$contextSharing === void 0 ? false : _ref$contextSharing,
      children = _ref.children;

  _react.default.useEffect(function () {
    client.mount();
    return function () {
      client.unmount();
    };
  }, [client]);

  var Context = getQueryClientContext(contextSharing);
  return /*#__PURE__*/_react.default.createElement(QueryClientSharingContext.Provider, {
    value: contextSharing
  }, /*#__PURE__*/_react.default.createElement(Context.Provider, {
    value: client
  }, children));
};

exports.QueryClientProvider = QueryClientProvider;