var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var ButtonGroup;module.link('@rocket.chat/fuselage',{ButtonGroup:function(v){ButtonGroup=v}},1);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},2);var ActionButton;module.link('../VoipActionButton',{default:function(v){ActionButton=v}},3);var __rest = (this && this.__rest) || function (s, e) {
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




const isIncoming = (props) => 'onDecline' in props && 'onAccept' in props && !('onEndCall' in props);
const isOngoing = (props) => 'onEndCall' in props && !('onAccept' in props && 'onDecline' in props);
const VoipActions = (_a) => {
    var { isMuted, isHeld, isDTMFActive, isTransferActive } = _a, events = __rest(_a, ["isMuted", "isHeld", "isDTMFActive", "isTransferActive"]);
    const { t } = useTranslation();
    return (_jsxs(ButtonGroup, { large: true, children: [isIncoming(events) && _jsx(ActionButton, { danger: true, label: t('Decline'), icon: 'phone-off', onClick: events.onDecline }), _jsx(ActionButton, { label: isMuted ? t('Turn_on_microphone') : t('Turn_off_microphone'), icon: 'mic-off', pressed: isMuted, disabled: !events.onMute, onClick: () => { var _a; return (_a = events.onMute) === null || _a === void 0 ? void 0 : _a.call(events, !isMuted); } }), !isIncoming(events) && (_jsx(ActionButton, { label: isHeld ? t('Resume') : t('Hold'), icon: 'pause-shape-unfilled', pressed: isHeld, disabled: !events.onHold, onClick: () => { var _a; return (_a = events.onHold) === null || _a === void 0 ? void 0 : _a.call(events, !isHeld); } })), _jsx(ActionButton, { label: isDTMFActive ? t('Close_Dialpad') : t('Open_Dialpad'), icon: 'dialpad', pressed: isDTMFActive, disabled: !events.onDTMF, onClick: events.onDTMF }), _jsx(ActionButton, { label: t('Transfer_call'), icon: 'arrow-forward', pressed: isTransferActive, disabled: !events.onTransfer, onClick: events.onTransfer }), isOngoing(events) && _jsx(ActionButton, { danger: true, label: t('End_call'), icon: 'phone-off', disabled: isHeld, onClick: events.onEndCall }), isIncoming(events) && _jsx(ActionButton, { success: true, label: t('Accept'), icon: 'phone', onClick: events.onAccept })] }));
};
module.exportDefault(VoipActions);
//# sourceMappingURL=VoipActions.js.map