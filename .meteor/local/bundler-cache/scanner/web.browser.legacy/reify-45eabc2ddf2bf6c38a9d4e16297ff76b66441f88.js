"use strict";

exports.__esModule = true;
exports.useInfiniteQuery = useInfiniteQuery;

var _infiniteQueryObserver = require("../core/infiniteQueryObserver");

var _utils = require("../core/utils");

var _useBaseQuery = require("./useBaseQuery");

function useInfiniteQuery(arg1, arg2, arg3) {
  var options = (0, _utils.parseQueryArgs)(arg1, arg2, arg3);
  return (0, _useBaseQuery.useBaseQuery)(options, _infiniteQueryObserver.InfiniteQueryObserver);
}