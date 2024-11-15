"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const fuselage_1 = require("@rocket.chat/fuselage");
const gazzodown_1 = require("@rocket.chat/gazzodown");
const message_parser_1 = require("@rocket.chat/message-parser");
const react_1 = require("react");
const useAppTranslation_1 = require("../hooks/useAppTranslation");
const MarkdownTextElement = ({ textObject }) => {
    const { t } = (0, useAppTranslation_1.useAppTranslation)();
    const text = textObject.i18n
        ? t(textObject.i18n.key, Object.assign({}, textObject.i18n.args))
        : textObject.text;
    if (!text) {
        return null;
    }
    return ((0, jsx_runtime_1.jsx)(react_1.Suspense, { fallback: (0, jsx_runtime_1.jsx)(fuselage_1.Skeleton, {}), children: (0, jsx_runtime_1.jsx)(gazzodown_1.Markup, { tokens: (0, message_parser_1.parse)(text, { emoticons: false }) }) }));
};
exports.default = MarkdownTextElement;
//# sourceMappingURL=MarkdownTextElement.js.map