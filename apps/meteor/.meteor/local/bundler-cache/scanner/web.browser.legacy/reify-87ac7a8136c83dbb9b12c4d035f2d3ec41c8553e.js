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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractInitialStateFromLayout = exports.UiKitComponent = void 0;
__exportStar(require("./hooks/useUiKitState"), exports);
__exportStar(require("./contexts/UiKitContext"), exports);
__exportStar(require("./surfaces"), exports);
var UiKitComponent_1 = require("./utils/UiKitComponent");
Object.defineProperty(exports, "UiKitComponent", { enumerable: true, get: function () { return UiKitComponent_1.UiKitComponent; } });
var extractInitialStateFromLayout_1 = require("./utils/extractInitialStateFromLayout");
Object.defineProperty(exports, "extractInitialStateFromLayout", { enumerable: true, get: function () { return extractInitialStateFromLayout_1.extractInitialStateFromLayout; } });
//# sourceMappingURL=index.js.map