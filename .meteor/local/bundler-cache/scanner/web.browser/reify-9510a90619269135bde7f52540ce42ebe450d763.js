module.export({Wrapper:()=>Wrapper,Aside:()=>Aside,Content:()=>Content,Logo:()=>Logo,Title:()=>Title,TitleHighlight:()=>TitleHighlight,Subtitle:()=>Subtitle,Description:()=>Description});let styled;module.link('@rocket.chat/styled',{default(v){styled=v}},0);let sans;module.link('../helpers/tokenFontFamilies',{sans(v){sans=v}},1);var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
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


var Wrapper = styled('div')(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  width: 100%;\n  box-sizing: border-box;\n  padding: 28px 16px;\n  display: flex;\n  flex-flow: column nowrap;\n  align-items: center;\n  justify-content: stretch;\n\n  @media (min-width: 1440px) {\n    flex-flow: row nowrap;\n    padding-inline: 0;\n    width: 100%;\n    max-width: 1152px;\n  }\n"], ["\n  width: 100%;\n  box-sizing: border-box;\n  padding: 28px 16px;\n  display: flex;\n  flex-flow: column nowrap;\n  align-items: center;\n  justify-content: stretch;\n\n  @media (min-width: 1440px) {\n    flex-flow: row nowrap;\n    padding-inline: 0;\n    width: 100%;\n    max-width: 1152px;\n  }\n"])));
var asideProps = function (_a) {
    var _justifyContent = _a.justifyContent, props = __rest(_a, ["justifyContent"]);
    return props;
};
var Aside = styled('div', asideProps)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n  box-sizing: border-box;\n  display: flex;\n  flex-flow: column nowrap;\n  align-items: center;\n  padding-block-end: 16px;\n  justify-content: ", ";\n  max-width: 576px;\n\n  @media (min-width: 1440px) {\n    align-items: flex-start;\n    min-height: 40rem;\n    flex: 1 0 50%;\n    padding-inline: 32px;\n  }\n"], ["\n  box-sizing: border-box;\n  display: flex;\n  flex-flow: column nowrap;\n  align-items: center;\n  padding-block-end: 16px;\n  justify-content: ", ";\n  max-width: 576px;\n\n  @media (min-width: 1440px) {\n    align-items: flex-start;\n    min-height: 40rem;\n    flex: 1 0 50%;\n    padding-inline: 32px;\n  }\n"])), function (p) { return (p.justifyContent ? p.justifyContent : ''); });
var Content = styled('div')(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n  width: 100%;\n  display: flex;\n  flex-flow: column nowrap;\n  align-items: center;\n\n  @media (min-width: 1440px) {\n    flex: 1 0 50%;\n  }\n"], ["\n  width: 100%;\n  display: flex;\n  flex-flow: column nowrap;\n  align-items: center;\n\n  @media (min-width: 1440px) {\n    flex: 1 0 50%;\n  }\n"])));
var Logo = styled('div')(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n  padding-block-end: 28px;\n\n  @media (min-width: 1440px) {\n    padding-block-end: 32px;\n  }\n"], ["\n  padding-block-end: 28px;\n\n  @media (min-width: 1440px) {\n    padding-block-end: 32px;\n  }\n"])));
var Title = styled('div')(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n  padding-block-end: 24px;\n  font-size: ", "rem;\n  font-family: ", ";\n  font-weight: 500;\n  line-height: ", "rem;\n  text-align: center;\n\n  @media (min-width: 1440px) {\n    text-align: start;\n    font-size: ", "rem;\n    line-height: ", "rem;\n  }\n"], ["\n  padding-block-end: 24px;\n  font-size: ", "rem;\n  font-family: ", ";\n  font-weight: 500;\n  line-height: ", "rem;\n  text-align: center;\n\n  @media (min-width: 1440px) {\n    text-align: start;\n    font-size: ", "rem;\n    line-height: ", "rem;\n  }\n"])), String(40 / 16), sans, String(42 / 16), String(52 / 16), String(62 / 16));
var TitleHighlight = styled('span', function (_a) {
    var _fontColor = _a.fontColor, props = __rest(_a, ["fontColor"]);
    return props;
})(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n  color: ", ";\n  display: inline-block;\n"], ["\n  color: ", ";\n  display: inline-block;\n"])), function (p) { return (p.fontColor ? p.fontColor : '#1D74F5'); });
var SubTitleFormPageProps = function (_a) {
    var _fontColor = _a.fontColor, _fontWeight = _a.fontWeight, props = __rest(_a, ["fontColor", "fontWeight"]);
    return props;
};
var Subtitle = styled('div', SubTitleFormPageProps)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["\n  font-size: ", "rem;\n  line-height: ", "rem;\n  font-family: ", ";\n  color: ", ";\n  font-weight: ", ";\n  text-align: center;\n\n  @media (min-width: 1440px) {\n    padding-block-end: 20px;\n    text-align: start;\n  }\n"], ["\n  font-size: ", "rem;\n  line-height: ", "rem;\n  font-family: ", ";\n  color: ", ";\n  font-weight: ", ";\n  text-align: center;\n\n  @media (min-width: 1440px) {\n    padding-block-end: 20px;\n    text-align: start;\n  }\n"])), String(16 / 16), String(22 / 16), sans, function (p) { return (p.fontColor ? p.fontColor : ''); }, function (p) { return (p.fontWeight ? p.fontWeight : '500'); });
var Description = styled('div')(templateObject_8 || (templateObject_8 = __makeTemplateObject(["\n  display: none;\n  font-family: ", ";\n\n  @media (min-width: 1440px) {\n    display: unset;\n  }\n"], ["\n  display: none;\n  font-family: ", ";\n\n  @media (min-width: 1440px) {\n    display: unset;\n  }\n"])), sans);
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
//# sourceMappingURL=FormPageLayout.styles.js.map