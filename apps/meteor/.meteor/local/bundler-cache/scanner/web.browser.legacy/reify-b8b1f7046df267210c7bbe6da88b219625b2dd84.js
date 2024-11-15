"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAssetPath = void 0;
const useAbsoluteUrl_1 = require("./useAbsoluteUrl");
const useSetting_1 = require("./useSetting");
const useAssetPath = (assetId) => {
    var _a, _b, _c;
    const asset = (0, useSetting_1.useSetting)(`Assets_${assetId}`);
    const absoluteUrl = (0, useAbsoluteUrl_1.useAbsoluteUrl)();
    return ((_a = asset === null || asset === void 0 ? void 0 : asset.url) !== null && _a !== void 0 ? _a : asset === null || asset === void 0 ? void 0 : asset.defaultUrl) && absoluteUrl((_c = (_b = asset === null || asset === void 0 ? void 0 : asset.url) !== null && _b !== void 0 ? _b : asset === null || asset === void 0 ? void 0 : asset.defaultUrl) !== null && _c !== void 0 ? _c : '');
};
exports.useAssetPath = useAssetPath;
//# sourceMappingURL=useAssetPath.js.map