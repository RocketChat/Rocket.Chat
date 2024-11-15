'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('./setBatchUpdatesFn.js');
var queryCore = require('@tanstack/query-core');
var useQueries = require('./useQueries.js');
var useQuery = require('./useQuery.js');
var QueryClientProvider = require('./QueryClientProvider.js');
var Hydrate = require('./Hydrate.js');
var QueryErrorResetBoundary = require('./QueryErrorResetBoundary.js');
var useIsFetching = require('./useIsFetching.js');
var useIsMutating = require('./useIsMutating.js');
var useMutation = require('./useMutation.js');
var useInfiniteQuery = require('./useInfiniteQuery.js');
var isRestoring = require('./isRestoring.js');



exports.useQueries = useQueries.useQueries;
exports.useQuery = useQuery.useQuery;
exports.QueryClientProvider = QueryClientProvider.QueryClientProvider;
exports.defaultContext = QueryClientProvider.defaultContext;
exports.useQueryClient = QueryClientProvider.useQueryClient;
exports.Hydrate = Hydrate.Hydrate;
exports.useHydrate = Hydrate.useHydrate;
exports.QueryErrorResetBoundary = QueryErrorResetBoundary.QueryErrorResetBoundary;
exports.useQueryErrorResetBoundary = QueryErrorResetBoundary.useQueryErrorResetBoundary;
exports.useIsFetching = useIsFetching.useIsFetching;
exports.useIsMutating = useIsMutating.useIsMutating;
exports.useMutation = useMutation.useMutation;
exports.useInfiniteQuery = useInfiniteQuery.useInfiniteQuery;
exports.IsRestoringProvider = isRestoring.IsRestoringProvider;
exports.useIsRestoring = isRestoring.useIsRestoring;
Object.keys(queryCore).forEach(function (k) {
  if (k !== 'default' && !exports.hasOwnProperty(k)) Object.defineProperty(exports, k, {
    enumerable: true,
    get: function () { return queryCore[k]; }
  });
});
//# sourceMappingURL=index.js.map
