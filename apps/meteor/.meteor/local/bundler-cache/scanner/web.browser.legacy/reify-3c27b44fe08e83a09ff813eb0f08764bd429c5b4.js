"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAppTranslation = void 0;
const react_1 = require("react");
const react_i18next_1 = require("react-i18next");
const AppIdContext_1 = require("../contexts/AppIdContext");
const useAppTranslation = () => {
    const appId = (0, AppIdContext_1.useAppId)();
    const appNs = appId.endsWith(`-core`) ? undefined : `app-${appId}`;
    (0, react_1.useDebugValue)(appNs);
    return (0, react_i18next_1.useTranslation)(appNs);
};
exports.useAppTranslation = useAppTranslation;
//# sourceMappingURL=useAppTranslation.js.map