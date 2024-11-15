let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let ToastBar;module.link('@rocket.chat/fuselage',{ToastBar(v){ToastBar=v}},1);let useCountdown;module.link('react-timing-hooks',{useCountdown(v){useCountdown=v}},2);let useToastBarDismiss;module.link('./ToastBarContext',{useToastBarDismiss(v){useToastBarDismiss=v}},3);



var ToastBarTimed = function (_a) {
    var time = _a.time, type = _a.type, id = _a.id, message = _a.message;
    var dismissToastMessage = useToastBarDismiss();
    var _b = useCountdown(time, 0, {
        onEnd: function () { return dismissToastMessage(id); },
        startOnMount: true,
    }), _c = _b[1], isPaused = _c.isPaused, pause = _c.pause, resume = _c.resume;
    return (_jsx(ToastBar, { variant: type, onPointerEnter: function () { return pause(); }, onPointerLeave: function () { return resume(); }, children: message, onClose: dismissToastMessage, id: id, time: time, isPaused: isPaused }));
};
module.exportDefault(ToastBarTimed);
//# sourceMappingURL=ToastBarTimed.js.map