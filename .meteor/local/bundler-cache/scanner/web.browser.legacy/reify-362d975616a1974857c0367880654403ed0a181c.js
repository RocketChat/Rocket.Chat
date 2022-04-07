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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fuselage_1 = require("@rocket.chat/fuselage");
var UiKit = __importStar(require("@rocket.chat/ui-kit"));
var react_1 = __importDefault(require("react"));
var Action = function (_a) {
    var element = _a.element, parser = _a.parser, index = _a.index;
    var renderedElement = parser.renderActionsBlockElement(element, index);
    if (!renderedElement) {
        return null;
    }
    return (react_1.default.createElement(fuselage_1.Box, { display: 'flex', margin: 4, flexGrow: element.type !== UiKit.BlockElementType.BUTTON ? 1 : undefined, flexBasis: element.type !== UiKit.BlockElementType.BUTTON ? '45%' : undefined }, renderedElement));
};
exports.default = Action;
//# sourceMappingURL=ActionsBlock.Action.js.map