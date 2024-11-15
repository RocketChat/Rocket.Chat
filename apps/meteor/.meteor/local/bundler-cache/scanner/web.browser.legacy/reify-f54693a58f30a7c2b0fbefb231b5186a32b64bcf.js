"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const fuselage_1 = require("@rocket.chat/fuselage");
const UiKit = __importStar(require("@rocket.chat/ui-kit"));
const breakpoints = {
    xs: 4,
    sm: 4,
    md: 4,
    lg: 6,
    xl: 6,
};
const Fields = ({ fields, surfaceRenderer }) => ((0, jsx_runtime_1.jsx)(fuselage_1.Grid, { children: fields.map((field, i) => ((0, react_1.createElement)(fuselage_1.Grid.Item, Object.assign({}, breakpoints, { key: i }), surfaceRenderer.renderTextObject(field, 0, UiKit.BlockContext.NONE)))) }));
exports.default = Fields;
//# sourceMappingURL=SectionBlock.Fields.js.map