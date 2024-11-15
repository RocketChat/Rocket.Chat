"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const useAppTranslation_1 = require("../hooks/useAppTranslation");
const PlainTextElement = ({ textObject }) => {
    const { t } = (0, useAppTranslation_1.useAppTranslation)();
    const text = textObject.i18n
        ? t(textObject.i18n.key, Object.assign({}, textObject.i18n.args))
        : textObject.text;
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: text });
};
exports.default = PlainTextElement;
//# sourceMappingURL=PlainTextElement.js.map