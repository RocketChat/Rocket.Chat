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
exports.RocketChatAssociationRecord = exports.RocketChatAssociationModel = exports.AppMethod = void 0;
const AppMethod_1 = require("./AppMethod");
Object.defineProperty(exports, "AppMethod", { enumerable: true, get: function () { return AppMethod_1.AppMethod; } });
const RocketChatAssociations_1 = require("./RocketChatAssociations");
Object.defineProperty(exports, "RocketChatAssociationModel", { enumerable: true, get: function () { return RocketChatAssociations_1.RocketChatAssociationModel; } });
Object.defineProperty(exports, "RocketChatAssociationRecord", { enumerable: true, get: function () { return RocketChatAssociations_1.RocketChatAssociationRecord; } });
__exportStar(require("./AppInterface"), exports);
//# sourceMappingURL=index.js.map