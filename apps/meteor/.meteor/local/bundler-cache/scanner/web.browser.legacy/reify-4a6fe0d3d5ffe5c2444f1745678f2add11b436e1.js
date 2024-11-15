var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var Button,ButtonGroup;module.link('@rocket.chat/fuselage',{Button:function(v){Button=v},ButtonGroup:function(v){ButtonGroup=v}},1);var useState;module.link('react',{useState:function(v){useState=v}},2);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},3);var DialPad,SettingsButton;module.link('../..',{VoipDialPad:function(v){DialPad=v},VoipSettingsButton:function(v){SettingsButton=v}},4);var useVoipAPI;module.link('../../../hooks/useVoipAPI',{useVoipAPI:function(v){useVoipAPI=v}},5);var Container;module.link('../components/VoipPopupContainer',{default:function(v){Container=v}},6);var Content;module.link('../components/VoipPopupContent',{default:function(v){Content=v}},7);var Footer;module.link('../components/VoipPopupFooter',{default:function(v){Footer=v}},8);var Header;module.link('../components/VoipPopupHeader',{default:function(v){Header=v}},9);









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