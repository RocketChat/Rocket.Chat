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
var react_1 = __importDefault(require("react"));
var breakpoints = {
    xs: 4,
    sm: 4,
    md: 4,
    lg: 6,
    xl: 6,
};
var Fields = function (_a) {
    var fields = _a.fields, surfaceRenderer = _a.surfaceRenderer;
    return (react_1.default.createElement(fuselage_1.Grid, null, fields.map(function (field, i) { return (react_1.default.createElement(fuselage_1.Grid.Item, __assign({}, breakpoints, { key: i }), surfaceRenderer.renderTextObject(field, 0, UiKit.BlockContext.NONE))); })));
};
exports.default = Fields;
//# sourceMappingURL=SectionBlock.Fields.js.map