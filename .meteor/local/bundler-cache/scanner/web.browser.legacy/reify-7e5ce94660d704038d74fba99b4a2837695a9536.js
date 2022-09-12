"use strict";

exports.__esModule = true;
var _exportNames = {
  QueryClientProvider: true,
  useQueryClient: true,
  QueryErrorResetBoundary: true,
  useQueryErrorResetBoundary: true,
  useIsFetching: true,
  useIsMutating: true,
  useMutation: true,
  useQuery: true,
  useQueries: true,
  useInfiniteQuery: true,
  useHydrate: true,
  Hydrate: true
};
exports.Hydrate = exports.useHydrate = exports.useInfiniteQuery = exports.useQueries = exports.useQuery = exports.useMutation = exports.useIsMutating = exports.useIsFetching = exports.useQueryErrorResetBoundary = exports.QueryErrorResetBoundary = exports.useQueryClient = exports.QueryClientProvider = void 0;

require("./setBatchUpdatesFn");

require("./setLogger");

var _QueryClientProvider = require("./QueryClientProvider");

exports.QueryClientProvider = _QueryClientProvider.QueryClientProvider;
exports.useQueryClient = _QueryClientProvider.useQueryClient;

var _QueryErrorResetBoundary = require("./QueryErrorResetBoundary");

exports.QueryErrorResetBoundary = _QueryErrorResetBoundary.QueryErrorResetBoundary;
exports.useQueryErrorResetBoundary = _QueryErrorResetBoundary.useQueryErrorResetBoundary;

var _useIsFetching = require("./useIsFetching");

exports.useIsFetching = _useIsFetching.useIsFetching;

var _useIsMutating = require("./useIsMutating");

exports.useIsMutating = _useIsMutating.useIsMutating;

var _useMutation = require("./useMutation");

exports.useMutation = _useMutation.useMutation;

var _useQuery = require("./useQuery");

exports.useQuery = _useQuery.useQuery;

var _useQueries = require("./useQueries");

exports.useQueries = _useQueries.useQueries;

var _useInfiniteQuery = require("./useInfiniteQuery");

exports.useInfiniteQuery = _useInfiniteQuery.useInfiniteQuery;

var _Hydrate = require("./Hydrate");

exports.useHydrate = _Hydrate.useHydrate;
exports.Hydrate = _Hydrate.Hydrate;

var _types = require("./types");

Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  exports[key] = _types[key];
});