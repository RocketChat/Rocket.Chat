'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var queryCore = require('@tanstack/query-core');
var useBaseQuery = require('./useBaseQuery.js');

function useQuery(arg1, arg2, arg3) {
  const parsedOptions = queryCore.parseQueryArgs(arg1, arg2, arg3);
  return useBaseQuery.useBaseQuery(parsedOptions, queryCore.QueryObserver);
}

exports.useQuery = useQuery;
//# sourceMappingURL=useQuery.js.map
