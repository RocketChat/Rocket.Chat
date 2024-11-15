let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let IconButton;module.link('@rocket.chat/fuselage',{IconButton(v){IconButton=v}},1);let GenericMenu;module.link('@rocket.chat/ui-client',{GenericMenu(v){GenericMenu=v}},2);let forwardRef;module.link('react',{forwardRef(v){forwardRef=v}},3);let useVoipDeviceSettings;module.link('./hooks/useVoipDeviceSettings',{useVoipDeviceSettings(v){useVoipDeviceSettings=v}},4);var __rest = (this && this.__rest) || function (s, e) {
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

/* eslint-disable react/no-multi-comp */




const CustomizeButton = forwardRef(function CustomizeButton(_a, ref) {
    var { mini } = _a, props = __rest(_a, ["mini"]);
    const size = mini ? 24 : 32;
    return _jsx(IconButton, Object.assign({}, props, { ref: ref, icon: 'customize', mini: true, width: size, height: size }));
});
const VoipSettingsButton = ({ mini = false }) => {
    const menu = useVoipDeviceSettings();
    return (_jsx(GenericMenu, { is: CustomizeButton, title: menu.title, disabled: menu.disabled, sections: menu.sections, selectionMode: 'multiple', placement: 'top-end', icon: 'customize', mini: mini }));
};
module.exportDefault(VoipSettingsButton);
//# sourceMappingURL=VoipSettingsButton.js.map