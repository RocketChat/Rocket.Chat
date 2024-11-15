'use client';
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var queryCore = require('@tanstack/query-core');
var useSyncExternalStore = require('./useSyncExternalStore');
var QueryClientProvider = require('./QueryClientProvider.js');
var utils = require('./utils.js');

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

function useMutation(arg1, arg2, arg3) {
  const options = queryCore.parseMutationArgs(arg1, arg2, arg3);
  const queryClient = QueryClientProvider.useQueryClient({
    context: options.context
  });
  const [observer] = React__namespace.useState(() => new queryCore.MutationObserver(queryClient, options));
  React__namespace.useEffect(() => {
    observer.setOptions(options);
  }, [observer, options]);
  const result = useSyncExternalStore.useSyncExternalStore(React__namespace.useCallback(onStoreChange => observer.subscribe(queryCore.notifyManager.batchCalls(onStoreChange)), [observer]), () => observer.getCurrentResult(), () => observer.getCurrentResult());
  const mutate = React__namespace.useCallback((variables, mutateOptions) => {
    observer.mutate(variables, mutateOptions).catch(noop);
  }, [observer]);

  if (result.error && utils.shouldThrowError(observer.options.useErrorBoundary, [result.error])) {
    throw result.error;
  }

  return { ...result,
    mutate,
    mutateAsync: result.mutate
  };
} // eslint-disable-next-line @typescript-eslint/no-empty-function

function noop() {}

exports.useMutation = useMutation;
//# sourceMappingURL=useMutation.js.map
