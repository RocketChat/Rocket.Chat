"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fuselage_1 = require("@rocket.chat/fuselage");
var react_1 = __importStar(require("react"));
var useUiKitState_1 = require("../hooks/useUiKitState");
var fromTextObjectToString_1 = require("../utils/fromTextObjectToString");
var StaticSelectElement = function (_a) {
    var block = _a.block, context = _a.context, surfaceRenderer = _a.surfaceRenderer;
    var _b = useUiKitState_1.useUiKitState(block, context), _c = _b[0], loading = _c.loading, value = _c.value, error = _c.error, action = _b[1];
    var options = react_1.useMemo(function () {
        return block.options.map(function (option, i) {
            var _a;
            return [
                option.value,
                (_a = fromTextObjectToString_1.fromTextObjectToString(surfaceRenderer, option.text, i)) !== null && _a !== void 0 ? _a : '',
            ];
        });
    }, [block.options, surfaceRenderer]);
    var handleChange = react_1.useCallback(function (value) {
        action({ target: { value: value } });
    }, [action]);
    return (react_1.default.createElement(fuselage_1.SelectFiltered, { value: value, disabled: loading, error: error, options: options, placeholder: fromTextObjectToString_1.fromTextObjectToString(surfaceRenderer, block.placeholder, 0), onChange: handleChange }));
};
exports.default = react_1.memo(StaticSelectElement);
//# sourceMappingURL=StaticSelectElement.js.map