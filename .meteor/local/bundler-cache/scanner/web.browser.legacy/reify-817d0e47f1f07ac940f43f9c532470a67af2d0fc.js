"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Surface = void 0;
var react_1 = __importDefault(require("react"));
var SurfaceContext_1 = require("../contexts/SurfaceContext");
var Surface = function (_a) {
    var children = _a.children, type = _a.type;
    return (react_1.default.createElement(SurfaceContext_1.SurfaceContext.Provider, { value: type }, children));
};
exports.Surface = Surface;
//# sourceMappingURL=Surface.js.map