'use client';
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var queryCore = require('@tanstack/query-core');
var useSyncExternalStore = require('./useSyncExternalStore');
var QueryErrorResetBoundary = require('./QueryErrorResetBoundary.js');
var QueryClientProvider = require('./QueryClientProvider.js');
var isRestoring = require('./isRestoring.js');
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

function useBaseQuery(options, Observer) {
  const queryClient = QueryClientProvider.useQueryClient({
    context: options.context
  });
  const isRestoring$1 = isRestoring.useIsRestoring();
  const errorResetBoundary = QueryErrorResetBoundary.useQueryErrorResetBoundary();
  const defaultedOptions = queryClient.defaultQueryOptions(options); // Make sure results are optimistically set in fetching state before subscribing or updating options

  defaultedOptions._optimisticResults = isRestoring$1 ? 'isRestoring' : 'optimistic'; // Include callbacks in batch renders

  if (defaultedOptions.onError) {
    defaultedOptions.onError = queryCore.notifyManager.batchCalls(defaultedOptions.onError);
  }

  if (defaultedOptions.onSuccess) {
    defaultedOptions.onSuccess = queryCore.notifyManager.batchCalls(defaultedOptions.onSuccess);
  }

  if (defaultedOptions.onSettled) {
    defaultedOptions.onSettled = queryCore.notifyManager.batchCalls(defaultedOptions.onSettled);
  }

  suspense.ensureStaleTime(defaultedOptions);
  errorBoundaryUtils.ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary);
  errorBoundaryUtils.useClearResetErrorBoundary(errorResetBoundary);
  const [observer] = React__namespace.useState(() => new Observer(queryClient, defaultedOptions));
  const result = observer.getOptimisticResult(defaultedOptions);
  useSyncExternalStore.useSyncExternalStore(React__namespace.useCallback(onStoreChange => {
    const unsubscribe = isRestoring$1 ? () => undefined : observer.subscribe(queryCore.notifyManager.batchCalls(onStoreChange)); // Update result to make sure we did not miss any query updates
    // between creating the observer and subscribing to it.

    observer.updateResult();
    return unsubscribe;
  }, [observer, isRestoring$1]), () => observer.getCurrentResult(), () => observer.getCurrentResult());
  React__namespace.useEffect(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setOptions(defaultedOptions, {
      listeners: false
    });
  }, [defaultedOptions, observer]); // Handle suspense

  if (suspense.shouldSuspend(defaultedOptions, result, isRestoring$1)) {
    throw suspense.fetchOptimistic(defaultedOptions, observer, errorResetBoundary);
  } // Handle error boundary


  if (errorBoundaryUtils.getHasError({
    result,
    errorResetBoundary,
    useErrorBoundary: defaultedOptions.useErrorBoundary,
    query: observer.getCurrentQuery()
  })) {
    throw result.error;
  } // Handle result property usage tracking


  return !defaultedOptions.notifyOnChangeProps ? observer.trackResult(result) : result;
}

exports.useBaseQuery = useBaseQuery;
//# sourceMappingURL=useBaseQuery.js.map
