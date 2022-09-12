"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

exports.__esModule = true;
exports.useQueries = useQueries;

var _react = _interopRequireWildcard(require("react"));

var _notifyManager = require("../core/notifyManager");

var _queriesObserver = require("../core/queriesObserver");

var _QueryClientProvider = require("./QueryClientProvider");

function useQueries(queries) {
  var mountedRef = _react.default.useRef(false);

  var _React$useState = _react.default.useState(0),
      forceUpdate = _React$useState[1];

  var queryClient = (0, _QueryClientProvider.useQueryClient)();
  var defaultedQueries = (0, _react.useMemo)(function () {
    return queries.map(function (options) {
      var defaultedOptions = queryClient.defaultQueryObserverOptions(options); // Make sure the results are already in fetching state before subscribing or updating options

      defaultedOptions.optimisticResults = true;
      return defaultedOptions;
    });
  }, [queries, queryClient]);

  var _React$useState2 = _react.default.useState(function () {
    return new _queriesObserver.QueriesObserver(queryClient, defaultedQueries);
  }),
      observer = _React$useState2[0];

  var result = observer.getOptimisticResult(defaultedQueries);

  _react.default.useEffect(function () {
    mountedRef.current = true;
    var unsubscribe = observer.subscribe(_notifyManager.notifyManager.batchCalls(function () {
      if (mountedRef.current) {
        forceUpdate(function (x) {
          return x + 1;
        });
      }
    }));
    return function () {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [observer]);

  _react.default.useEffect(function () {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setQueries(defaultedQueries, {
      listeners: false
    });
  }, [defaultedQueries, observer]);

  return result;
}