"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStringFromTextObject = void 0;
const react_1 = require("react");
const useAppTranslation_1 = require("./useAppTranslation");
const useStringFromTextObject = () => {
    const { t } = (0, useAppTranslation_1.useAppTranslation)();
    return (0, react_1.useCallback)((textObject) => {
        if (!textObject) {
            return undefined;
        }
        return textObject.i18n
            ? t === null || t === void 0 ? void 0 : t(textObject.i18n.key, Object.assign({}, textObject.i18n.args))
            : textObject.text;
    }, [t]);
};
exports.useStringFromTextObject = useStringFromTextObject;
//# sourceMappingURL=useStringFromTextObject.js.map