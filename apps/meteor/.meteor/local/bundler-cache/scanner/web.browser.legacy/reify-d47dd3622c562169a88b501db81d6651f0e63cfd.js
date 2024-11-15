"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTranslation = void 0;
const react_1 = require("react");
const TranslationContext_1 = require("../TranslationContext");
const useTranslation = () => (0, react_1.useContext)(TranslationContext_1.TranslationContext).translate;
exports.useTranslation = useTranslation;
//# sourceMappingURL=useTranslation.js.map