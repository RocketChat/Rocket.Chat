"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var layout_1 = require("@rocket.chat/layout");
var react_i18next_1 = require("react-i18next");
var FormPageLayoutOnboard = function (_a) {
    var title = _a.title, subtitle = _a.subtitle, description = _a.description, children = _a.children;
    var t = (0, react_i18next_1.useTranslation)().t;
    return ((0, jsx_runtime_1.jsxs)(layout_1.HorizontalWizardLayout, { children: [(0, jsx_runtime_1.jsxs)(layout_1.HorizontalWizardLayoutAside, { children: [(0, jsx_runtime_1.jsx)(layout_1.HorizontalWizardLayoutTitle, { children: title || t('page.form.title') }), subtitle && ((0, jsx_runtime_1.jsx)(layout_1.HorizontalWizardLayoutSubtitle, { children: subtitle })), (0, jsx_runtime_1.jsx)(layout_1.HorizontalWizardLayoutDescription, { children: description })] }), (0, jsx_runtime_1.jsx)(layout_1.HorizontalWizardLayoutContent, { children: children })] }));
};
exports.default = FormPageLayoutOnboard;
//# sourceMappingURL=FormPageLayout.js.map