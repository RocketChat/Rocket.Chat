"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeLanguage = void 0;
const normalizeLanguage = (language) => {
    // Fix browsers having all-lowercase language settings eg. pt-br, en-us
    const regex = /([a-z]{2,3})-([a-z]{2,4})/;
    const matches = regex.exec(language);
    if (matches) {
        return `${matches[1]}-${matches[2].toUpperCase()}`;
    }
    return language;
};
exports.normalizeLanguage = normalizeLanguage;
//# sourceMappingURL=normalizeLanguage.js.map