"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAssetWithDarkModePath = void 0;
const fuselage_hooks_1 = require("@rocket.chat/fuselage-hooks");
const useAssetPath_1 = require("./useAssetPath");
const useUserPreference_1 = require("./useUserPreference");
const useAssetWithDarkModePath = (assetId) => {
    const userThemePreference = (0, useUserPreference_1.useUserPreference)('themeAppearence') || 'auto';
    const theme = (0, fuselage_hooks_1.useDarkMode)(userThemePreference === 'auto' ? undefined : userThemePreference === 'dark') ? 'dark' : 'light';
    const themeAssetId = theme === 'dark' ? `${assetId}_dark` : assetId;
    return (0, useAssetPath_1.useAssetPath)(themeAssetId);
};
exports.useAssetWithDarkModePath = useAssetWithDarkModePath;
//# sourceMappingURL=useAssetWithDarkModePath.js.map