"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLanguages = void 0;
const react_1 = require("react");
const TranslationContext_1 = require("../TranslationContext");
const useLanguages = () => (0, react_1.useContext)(TranslationContext_1.TranslationContext).languages;
exports.useLanguages = useLanguages;
//# sourceMappingURL=useLanguages.js.map