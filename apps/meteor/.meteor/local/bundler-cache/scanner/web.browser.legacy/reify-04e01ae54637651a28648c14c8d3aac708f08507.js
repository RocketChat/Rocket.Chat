'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var useSyncExternalStore = require('./useSyncExternalStore');
var queryCore = require('@tanstack/query-core');
var QueryClientProvider = require('./QueryClientProvider.js');
var isRestoring = require('./isRestoring.js');
var QueryErrorResetBoundary = require('./QueryErrorResetBoundary.js');
var errorBoundaryUtils = require('./errorBoundaryUtils.js');
var suspense = require('./suspense.js');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespace(React);

// - `context` is omitted as it is passed as a root-level option to `useQueries` instead.

function useQueries({
  queries,
  context
}) {
  const queryClient = QueryClientProvider.useQueryClient({
    context
  });
  const isRestoring$1 = isRestoring.useIsRestoring();
  const defaultedQueries = React__namespace.useMemo(() => queries.map(options => {
    const defaultedOptions = queryClient.defaultQueryOptions(options); // Make sure the results are already in fetching state before subscribing or updating options

    defaultedOptions._optimisticResults = isRestoring$1 ? 'isRestoring' : 'optimistic';
    return defaultedOptions;
  }), [queries, queryClient, isRestoring$1]);
  const [observer] = React__namespace.useState(() => new queryCore.QueriesObserver(queryClient, defaultedQueries));
  const optimisticResult = observer.getOptimisticResult(defaultedQueries);
  useSyncExternalStore.useSyncExternalStore(React__namespace.useCallback(onStoreChange => isRestoring$1 ? () => undefined : observer.subscribe(queryCore.notifyManager.batchCalls(onStoreChange)), [observer, isRestoring$1]), () => observer.getCurrentResult(), () => observer.getCurrentResult());
  React__namespace.useEffect(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setQueries(defaultedQueries, {
      listeners: false
    });
  }, [defaultedQueries, observer]);
  const errorResetBoundary = QueryErrorResetBoundary.useQueryErrorResetBoundary();
  defaultedQueries.forEach(query => {
    errorBoundaryUtils.ensurePreventErrorBoundaryRetry(query, errorResetBoundary);
    suspense.ensureStaleTime(query);
  });
  errorBoundaryUtils.useClearResetErrorBoundary(errorResetBoundary);
  const shouldAtLeastOneSuspend = optimisticResult.some((result, index) => suspense.shouldSuspend(defaultedQueries[index], result, isRestoring$1));
  const suspensePromises = shouldAtLeastOneSuspend ? optimisticResult.flatMap((result, index) => {
    const options = defaultedQueries[index];
    const queryObserver = observer.getObservers()[index];

    if (options && queryObserver) {
      if (suspense.shouldSuspend(options, result, isRestoring$1)) {
        return suspense.fetchOptimistic(options, queryObserver, errorResetBoundary);
      } else if (suspense.willFetch(result, isRestoring$1)) {
        void suspense.fetchOptimistic(options, queryObserver, errorResetBoundary);
      }
    }

    return [];
  }) : [];

  if (suspensePromises.length > 0) {
    throw Promise.all(suspensePromises);
  }

  const firstSingleResultWhichShouldThrow = optimisticResult.find((result, index) => {
    var _defaultedQueries$ind, _defaultedQueries$ind2;

    return errorBoundaryUtils.getHasError({
      result,
      errorResetBoundary,
      useErrorBoundary: (_defaultedQueries$ind = (_defaultedQueries$ind2 = defaultedQueries[index]) == null ? void 0 : _defaultedQueries$ind2.useErrorBoundary) != null ? _defaultedQueries$ind : false,
      query: observer.getQueries()[index]
    });
  });

  if (firstSingleResultWhichShouldThrow != null && firstSingleResultWhichShouldThrow.error) {
    throw firstSingleResultWhichShouldThrow.error;
  }

  return optimisticResult;
}

exports.useQueries = useQueries;
//# sourceMappingURL=useQueries.js.map
