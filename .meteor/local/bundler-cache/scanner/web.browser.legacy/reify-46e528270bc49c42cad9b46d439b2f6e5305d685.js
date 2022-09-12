"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.useHydrate = useHydrate;
exports.Hydrate = void 0;

var _react = _interopRequireDefault(require("react"));

var _core = require("../core");

var _QueryClientProvider = require("./QueryClientProvider");

function useHydrate(state, options) {
  var queryClient = (0, _QueryClientProvider.useQueryClient)();

  var optionsRef = _react.default.useRef(options);

  optionsRef.current = options; // Running hydrate again with the same queries is safe,
  // it wont overwrite or initialize existing queries,
  // relying on useMemo here is only a performance optimization.
  // hydrate can and should be run *during* render here for SSR to work properly

  _react.default.useMemo(function () {
    if (state) {
      (0, _core.hydrate)(queryClient, state, optionsRef.current);
    }
  }, [queryClient, state]);
}

var Hydrate = function Hydrate(_ref) {
  var children = _ref.children,
      options = _ref.options,
      state = _ref.state;
  useHydrate(state, options);
  return children;
};

exports.Hydrate = Hydrate;