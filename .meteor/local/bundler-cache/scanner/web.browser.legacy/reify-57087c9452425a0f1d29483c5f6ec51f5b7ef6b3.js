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
var SectionBlock_Fields_1 = __importDefault(require("./SectionBlock.Fields"));
var SectionBlock = function (_a) {
    var className = _a.className, block = _a.block, surfaceRenderer = _a.surfaceRenderer;
    var text = block.text, fields = block.fields;
    var accessoryElement = react_1.useMemo(function () {
        return block.accessory
            ? __assign({ appId: block.appId, blockId: block.blockId }, block.accessory) : undefined;
    }, [block.appId, block.blockId, block.accessory]);
    return (react_1.default.createElement(fuselage_1.Grid, { className: className },
        react_1.default.createElement(fuselage_1.Grid.Item, null,
            text && (react_1.default.createElement(fuselage_1.Box, { is: 'span', fontScale: 'p2', color: 'default' }, surfaceRenderer.text(text))),
            fields && react_1.default.createElement(SectionBlock_Fields_1.default, { fields: fields, surfaceRenderer: surfaceRenderer })),
        block.accessory && (react_1.default.createElement(fuselage_1.Flex.Item, { grow: 0 },
            react_1.default.createElement(fuselage_1.Grid.Item, null, accessoryElement
                ? surfaceRenderer.renderSectionAccessoryBlockElement(accessoryElement, 0)
                : null)))));
};
exports.default = react_1.memo(SectionBlock);
//# sourceMappingURL=SectionBlock.js.map