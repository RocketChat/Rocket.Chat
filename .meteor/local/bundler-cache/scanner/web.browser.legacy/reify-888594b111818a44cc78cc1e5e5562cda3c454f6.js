"use strict";

exports.__esModule = true;
exports.useQuery = useQuery;

var _core = require("../core");

var _utils = require("../core/utils");

var _useBaseQuery = require("./useBaseQuery");

function useQuery(arg1, arg2, arg3) {
  var parsedOptions = (0, _utils.parseQueryArgs)(arg1, arg2, arg3);
  return (0, _useBaseQuery.useBaseQuery)(parsedOptions, _core.QueryObserver);
}