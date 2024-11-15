let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Button,ButtonGroup;module.link('@rocket.chat/fuselage',{Button(v){Button=v},ButtonGroup(v){ButtonGroup=v}},1);let useState;module.link('react',{useState(v){useState=v}},2);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},3);let DialPad,SettingsButton;module.link('../..',{VoipDialPad(v){DialPad=v},VoipSettingsButton(v){SettingsButton=v}},4);let useVoipAPI;module.link('../../../hooks/useVoipAPI',{useVoipAPI(v){useVoipAPI=v}},5);let Container;module.link('../components/VoipPopupContainer',{default(v){Container=v}},6);let Content;module.link('../components/VoipPopupContent',{default(v){Content=v}},7);let Footer;module.link('../components/VoipPopupFooter',{default(v){Footer=v}},8);let Header;module.link('../components/VoipPopupHeader',{default(v){Header=v}},9);









const VoipDialerView = ({ position }) => {
    const { t } = useTranslation();
    const { makeCall, closeDialer } = useVoipAPI();
    const [number, setNumber] = useState('');
    const handleCall = () => {
        makeCall(number);
        closeDialer();
    };
    return (_jsxs(Container, { secondary: true, "data-testid": 'vc-popup-dialer', position: position, children: [_jsx(Header, { hideSettings: true, onClose: closeDialer, children: t('New_Call') }), _jsx(Content, { children: _jsx(DialPad, { editable: true, value: number, onChange: (value) => setNumber(value) }) }), _jsx(Footer, { children: _jsxs(ButtonGroup, { large: true, children: [_jsx(SettingsButton, {}), _jsx(Button, { medium: true, success: true, icon: 'phone', disabled: !number, flexGrow: 1, onClick: handleCall, children: t('Call') })] }) })] }));
};
module.exportDefault(VoipDialerView);
//# sourceMappingURL=VoipDialerView.js.map