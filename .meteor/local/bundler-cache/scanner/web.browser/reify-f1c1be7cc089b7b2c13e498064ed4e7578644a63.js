let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box,InputBox;module.link('@rocket.chat/fuselage',{Box(v){Box=v},InputBox(v){InputBox=v}},1);let forwardRef;module.link('react',{forwardRef(v){forwardRef=v}},2);var __assign = (this && this.__assign) || function () {
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



var WorkspaceUrlInput = forwardRef(function TextInput(props, ref) {
    var domain = props.domain;
    return (_jsx(InputBox, __assign({ type: 'text', ref: ref }, props, { addon: _jsx(Box, __assign({ borderInlineStart: '2px solid', mb: 'neg-x8', pb: 'x8', borderColor: 'neutral-500', color: 'info', pis: 'x12' }, { children: domain }), void 0) }), void 0));
});
module.exportDefault(WorkspaceUrlInput);
//# sourceMappingURL=WorkspaceUrlInput.js.map