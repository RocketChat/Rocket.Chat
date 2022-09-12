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
var UiKit = __importStar(require("@rocket.chat/ui-kit"));
var react_1 = __importStar(require("react"));
var SurfaceContext_1 = require("../contexts/SurfaceContext");
var ActionsBlock_Action_1 = __importDefault(require("./ActionsBlock.Action"));
var ActionsBlock = function (_a) {
    var className = _a.className, block = _a.block, surfaceRenderer = _a.surfaceRenderer;
    var surfaceType = SurfaceContext_1.useSurfaceType();
    var _b = react_1.useState(function () { return block.elements.length > 5 && surfaceType !== 'banner'; }), showMoreVisible = _b[0], setShowMoreVisible = _b[1];
    var handleShowMoreClick = react_1.useCallback(function () {
        setShowMoreVisible(false);
    }, []);
    var actionElements = react_1.useMemo(function () {
        return (showMoreVisible ? block.elements.slice(0, 5) : block.elements).map(function (element) {
            var _a, _b;
            return (__assign(__assign({}, element), { appId: (_a = element.appId) !== null && _a !== void 0 ? _a : block.appId, blockId: (_b = element.blockId) !== null && _b !== void 0 ? _b : block.blockId }));
        });
    }, [block.appId, block.blockId, block.elements, showMoreVisible]);
    return (react_1.default.createElement(fuselage_1.Box, { className: className, display: 'flex', flexWrap: 'wrap', margin: -4 },
        actionElements.map(function (element, i) { return (react_1.default.createElement(ActionsBlock_Action_1.default, { key: i, element: element, parser: surfaceRenderer, index: i })); }),
        showMoreVisible && (react_1.default.createElement(fuselage_1.Box, { display: 'flex', margin: 4 },
            react_1.default.createElement(fuselage_1.Button, { small: true, onClick: handleShowMoreClick }, surfaceRenderer.renderTextObject({ type: 'plain_text', text: 'Show more...' }, 0, UiKit.BlockContext.NONE))))));
};
exports.default = react_1.memo(ActionsBlock);
//# sourceMappingURL=ActionsBlock.js.map