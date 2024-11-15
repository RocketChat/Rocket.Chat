"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var fuselage_1 = require("@rocket.chat/fuselage");
var colors_json_1 = __importDefault(require("@rocket.chat/fuselage-tokens/colors.json"));
var layout_1 = require("@rocket.chat/layout");
var react_1 = require("react");
var server_1 = require("react-dom/server");
var react_i18next_1 = require("react-i18next");
var PlanFeatureIcon_1 = __importDefault(require("../../common/PlanFeatureIcon"));
var Description = function () {
    var isDarkMode = layout_1.DarkModeProvider.useDarkMode();
    var color = isDarkMode ? colors_json_1.default.white : colors_json_1.default.n900;
    var t = (0, react_i18next_1.useTranslation)().t;
    var featuresList = [
        t('page.createCloudWorkspace.auditing'),
        t('page.createCloudWorkspace.numberOfIntegrations'),
        t('page.createCloudWorkspace.ldap'),
        t('page.createCloudWorkspace.omnichannel'),
        t('page.createCloudWorkspace.sla'),
        t('page.createCloudWorkspace.push'),
        t('page.createCloudWorkspace.engagement'),
    ];
    var icon = (0, react_1.useMemo)(function () {
        return encodeURIComponent((0, server_1.renderToStaticMarkup)((0, jsx_runtime_1.jsx)(PlanFeatureIcon_1.default, { color: color })));
    }, [color]);
    var listItem = function (text, id) { return ((0, jsx_runtime_1.jsxs)(layout_1.List.Item, __assign({ fontScale: 'p1' }, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.Icon, { name: 'check', size: 'x24', mie: 12 }), text] }), id)); };
    return ((0, jsx_runtime_1.jsx)(fuselage_1.Box, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Box, { children: (0, jsx_runtime_1.jsx)(layout_1.List, __assign({ color: color, spacing: 'x16', icon: icon }, { children: featuresList.map(function (text, id) { return listItem(text, id); }) })) }) }));
};
exports.default = Description;
//# sourceMappingURL=Description.js.map