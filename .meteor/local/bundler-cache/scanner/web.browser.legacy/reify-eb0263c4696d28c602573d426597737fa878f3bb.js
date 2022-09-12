"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fuselage_1 = require("@rocket.chat/fuselage");
var react_1 = __importStar(require("react"));
var ContextBlock_Item_1 = __importDefault(require("./ContextBlock.Item"));
var ContextBlock = function (_a) {
    var className = _a.className, block = _a.block, surfaceRenderer = _a.surfaceRenderer;
    var itemElements = react_1.useMemo(function () {
        return block.elements.map(function (element) { return (__assign(__assign({}, element), { appId: block.appId, blockId: block.blockId })); });
    }, [block.appId, block.blockId, block.elements]);
    return (react_1.default.createElement(fuselage_1.Box, { className: className, display: 'flex', alignItems: 'center', margin: -4 }, itemElements.map(function (element, i) { return (react_1.default.createElement(ContextBlock_Item_1.default, { key: i, block: element, surfaceRenderer: surfaceRenderer, index: i })); })));
};
exports.default = react_1.memo(ContextBlock);
//# sourceMappingURL=ContextBlock.js.map