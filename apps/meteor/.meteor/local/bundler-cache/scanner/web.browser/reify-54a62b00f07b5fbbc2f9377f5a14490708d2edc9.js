"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLanguage = void 0;
const react_1 = require("react");
const TranslationContext_1 = require("../TranslationContext");
const useLanguage = () => (0, react_1.useContext)(TranslationContext_1.TranslationContext).language;
exports.useLanguage = useLanguage;
//# sourceMappingURL=useLanguage.js.map