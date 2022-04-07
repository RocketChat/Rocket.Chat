let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Icon;module.link('@rocket.chat/fuselage',{Icon(v){Icon=v}},1);let TooltipWrapper;module.link('./TooltipWrapper',{default(v){TooltipWrapper=v}},2);var __assign = (this && this.__assign) || function () {
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



var InformationTooltipTrigger = function (_a) {
    var text = _a.text;
    return (_jsx(TooltipWrapper, __assign({ text: text }, { children: _jsx(Icon, { name: 'info' }, void 0) }), void 0));
};
module.exportDefault(InformationTooltipTrigger);
//# sourceMappingURL=InformationTooltipTrigger.js.map