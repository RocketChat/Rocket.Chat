'use client';
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var queryCore = require('@tanstack/query-core');
var useBaseQuery = require('./useBaseQuery.js');

function useInfiniteQuery(arg1, arg2, arg3) {
  const options = queryCore.parseQueryArgs(arg1, arg2, arg3);
  return useBaseQuery.useBaseQuery(options, queryCore.InfiniteQueryObserver);
}

exports.useInfiniteQuery = useInfiniteQuery;
//# sourceMappingURL=useInfiniteQuery.js.map
