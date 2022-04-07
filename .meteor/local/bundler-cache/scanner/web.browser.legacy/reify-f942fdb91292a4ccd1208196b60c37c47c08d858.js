"use strict";

exports.__esModule = true;
var _exportNames = {
  CancelledError: true,
  QueryCache: true,
  QueryClient: true,
  QueryObserver: true,
  QueriesObserver: true,
  InfiniteQueryObserver: true,
  MutationCache: true,
  MutationObserver: true,
  setLogger: true,
  notifyManager: true,
  focusManager: true,
  onlineManager: true,
  hashQueryKey: true,
  isError: true,
  isCancelledError: true,
  dehydrate: true,
  hydrate: true
};
exports.hydrate = exports.dehydrate = exports.isCancelledError = exports.isError = exports.hashQueryKey = exports.onlineManager = exports.focusManager = exports.notifyManager = exports.setLogger = exports.MutationObserver = exports.MutationCache = exports.InfiniteQueryObserver = exports.QueriesObserver = exports.QueryObserver = exports.QueryClient = exports.QueryCache = exports.CancelledError = void 0;

var _retryer = require("./retryer");

exports.CancelledError = _retryer.CancelledError;
exports.isCancelledError = _retryer.isCancelledError;

var _queryCache = require("./queryCache");

exports.QueryCache = _queryCache.QueryCache;

var _queryClient = require("./queryClient");

exports.QueryClient = _queryClient.QueryClient;

var _queryObserver = require("./queryObserver");

exports.QueryObserver = _queryObserver.QueryObserver;

var _queriesObserver = require("./queriesObserver");

exports.QueriesObserver = _queriesObserver.QueriesObserver;

var _infiniteQueryObserver = require("./infiniteQueryObserver");

exports.InfiniteQueryObserver = _infiniteQueryObserver.InfiniteQueryObserver;

var _mutationCache = require("./mutationCache");

exports.MutationCache = _mutationCache.MutationCache;

var _mutationObserver = require("./mutationObserver");

exports.MutationObserver = _mutationObserver.MutationObserver;

var _logger = require("./logger");

exports.setLogger = _logger.setLogger;

var _notifyManager = require("./notifyManager");

exports.notifyManager = _notifyManager.notifyManager;

var _focusManager = require("./focusManager");

exports.focusManager = _focusManager.focusManager;

var _onlineManager = require("./onlineManager");

exports.onlineManager = _onlineManager.onlineManager;

var _utils = require("./utils");

exports.hashQueryKey = _utils.hashQueryKey;
exports.isError = _utils.isError;

var _hydration = require("./hydration");

exports.dehydrate = _hydration.dehydrate;
exports.hydrate = _hydration.hydrate;

var _types = require("./types");

Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  exports[key] = _types[key];
});