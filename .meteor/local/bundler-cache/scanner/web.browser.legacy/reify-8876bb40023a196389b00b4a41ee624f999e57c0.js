"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.useIsMutating = useIsMutating;

var _react = _interopRequireDefault(require("react"));

var _notifyManager = require("../core/notifyManager");

var _utils = require("../core/utils");

var _QueryClientProvider = require("./QueryClientProvider");

function useIsMutating(arg1, arg2) {
  var mountedRef = _react.default.useRef(false);

  var filters = (0, _utils.parseMutationFilterArgs)(arg1, arg2);
  var queryClient = (0, _QueryClientProvider.useQueryClient)();

  var _React$useState = _react.default.useState(queryClient.isMutating(filters)),
      isMutating = _React$useState[0],
      setIsMutating = _React$useState[1];

  var filtersRef = _react.default.useRef(filters);

  filtersRef.current = filters;

  var isMutatingRef = _react.default.useRef(isMutating);

  isMutatingRef.current = isMutating;

  _react.default.useEffect(function () {
    mountedRef.current = true;
    var unsubscribe = queryClient.getMutationCache().subscribe(_notifyManager.notifyManager.batchCalls(function () {
      if (mountedRef.current) {
        var newIsMutating = queryClient.isMutating(filtersRef.current);

        if (isMutatingRef.current !== newIsMutating) {
          setIsMutating(newIsMutating);
        }
      }
    }));
    return function () {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [queryClient]);

  return isMutating;
}