"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Description = exports.Subtitle = exports.TitleHighlight = exports.Title = exports.Logo = exports.Content = exports.Aside = exports.Wrapper = void 0;
var styled_1 = __importDefault(require("@rocket.chat/styled"));
var tokenFontFamilies_1 = require("../helpers/tokenFontFamilies");
exports.Wrapper = (0, styled_1.default)('div')(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  width: 100%;\n  box-sizing: border-box;\n  padding: 28px 16px;\n  display: flex;\n  flex-flow: column nowrap;\n  align-items: center;\n  justify-content: center;\n\n  @media (min-width: 1440px) {\n    flex-flow: row nowrap;\n    align-items: start;\n    padding-inline: 0;\n    width: 100%;\n    max-width: 1152px;\n  }\n"], ["\n  width: 100%;\n  box-sizing: border-box;\n  padding: 28px 16px;\n  display: flex;\n  flex-flow: column nowrap;\n  align-items: center;\n  justify-content: center;\n\n  @media (min-width: 1440px) {\n    flex-flow: row nowrap;\n    align-items: start;\n    padding-inline: 0;\n    width: 100%;\n    max-width: 1152px;\n  }\n"])));
var asideProps = function (_a) {
    var _justifyContent = _a.justifyContent, props = __rest(_a, ["justifyContent"]);
    return props;
};
exports.Aside = (0, styled_1.default)('div', asideProps)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n  box-sizing: border-box;\n  display: flex;\n  flex-flow: column nowrap;\n  align-items: center;\n  padding-block-end: 16px;\n  justify-content: ", ";\n  max-width: 576px;\n\n  @media (min-width: 1440px) {\n    align-items: flex-start;\n\n    flex: 1 0 50%;\n    padding-inline: 32px;\n  }\n"], ["\n  box-sizing: border-box;\n  display: flex;\n  flex-flow: column nowrap;\n  align-items: center;\n  padding-block-end: 16px;\n  justify-content: ", ";\n  max-width: 576px;\n\n  @media (min-width: 1440px) {\n    align-items: flex-start;\n\n    flex: 1 0 50%;\n    padding-inline: 32px;\n  }\n"])), function (p) { return (p.justifyContent ? p.justifyContent : ''); });
exports.Content = (0, styled_1.default)('div')(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n  width: 100%;\n  display: flex;\n  flex-flow: column nowrap;\n  align-items: center;\n\n  @media (min-width: 1440px) {\n    flex: 1 0 50%;\n  }\n"], ["\n  width: 100%;\n  display: flex;\n  flex-flow: column nowrap;\n  align-items: center;\n\n  @media (min-width: 1440px) {\n    flex: 1 0 50%;\n  }\n"])));
exports.Logo = (0, styled_1.default)('div')(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n  padding-block-end: 28px;\n\n  @media (min-width: 1440px) {\n    padding-block-end: 32px;\n  }\n"], ["\n  padding-block-end: 28px;\n\n  @media (min-width: 1440px) {\n    padding-block-end: 32px;\n  }\n"])));
exports.Title = (0, styled_1.default)('h1')(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n  padding-block-end: 32px;\n  font-size: ", "rem;\n  font-family: ", ";\n  font-weight: 800;\n  line-height: ", "rem;\n  text-align: center;\n\n  @media (min-width: 1440px) {\n    text-align: start;\n  }\n"], ["\n  padding-block-end: 32px;\n  font-size: ", "rem;\n  font-family: ", ";\n  font-weight: 800;\n  line-height: ", "rem;\n  text-align: center;\n\n  @media (min-width: 1440px) {\n    text-align: start;\n  }\n"])), String(48 / 16), tokenFontFamilies_1.sans, String(64 / 16));
exports.TitleHighlight = (0, styled_1.default)('span', function (_a) {
    var _fontColor = _a.fontColor, _isDark = _a.isDark, props = __rest(_a, ["fontColor", "isDark"]);
    return props;
})(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n  color: ", ";\n  display: inline-block;\n"], ["\n  color: ", ";\n  display: inline-block;\n"])), function (p) { return (p.isDark ? '#76B7FC' : '#095AD2'); });
var SubTitleFormPageProps = function (_a) {
    var _fontColor = _a.fontColor, _fontWeight = _a.fontWeight, props = __rest(_a, ["fontColor", "fontWeight"]);
    return props;
};
exports.Subtitle = (0, styled_1.default)('h2', SubTitleFormPageProps)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["\n  font-size: ", "rem;\n  line-height: ", "rem;\n  font-family: ", ";\n  color: ", ";\n  font-weight: ", ";\n  text-align: center;\n\n  @media (min-width: 1440px) {\n    padding-block-end: 20px;\n    text-align: start;\n  }\n"], ["\n  font-size: ", "rem;\n  line-height: ", "rem;\n  font-family: ", ";\n  color: ", ";\n  font-weight: ", ";\n  text-align: center;\n\n  @media (min-width: 1440px) {\n    padding-block-end: 20px;\n    text-align: start;\n  }\n"])), String(16 / 16), String(22 / 16), tokenFontFamilies_1.sans, function (p) { return (p.fontColor ? p.fontColor : ''); }, function (p) { return (p.fontWeight ? p.fontWeight : '500'); });
exports.Description = (0, styled_1.default)('div')(templateObject_8 || (templateObject_8 = __makeTemplateObject(["\n  font-family: ", ";\n\n  // p2\n  font-size: ", "rem;\n  line-height: ", "rem;\n\n  @media (min-width: 1440px) {\n    display: unset;\n  }\n"], ["\n  font-family: ", ";\n\n  // p2\n  font-size: ", "rem;\n  line-height: ", "rem;\n\n  @media (min-width: 1440px) {\n    display: unset;\n  }\n"])), tokenFontFamilies_1.sans, String(14 / 16), String(20 / 16));
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
//# sourceMappingURL=FormPageLayout.styles.js.map