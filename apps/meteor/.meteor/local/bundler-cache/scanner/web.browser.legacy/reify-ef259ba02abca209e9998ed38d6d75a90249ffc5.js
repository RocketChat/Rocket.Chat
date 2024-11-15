"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLoadLanguage = void 0;
const react_1 = require("react");
const TranslationContext_1 = require("../TranslationContext");
const useLoadLanguage = () => (0, react_1.useContext)(TranslationContext_1.TranslationContext).loadLanguage;
exports.useLoadLanguage = useLoadLanguage;
//# sourceMappingURL=useLoadLanguage.js.map