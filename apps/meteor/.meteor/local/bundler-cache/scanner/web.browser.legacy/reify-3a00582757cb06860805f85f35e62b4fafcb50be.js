"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var fuselage_1 = require("@rocket.chat/fuselage");
var react_timing_hooks_1 = require("react-timing-hooks");
var ToastBarContext_1 = require("./ToastBarContext");
var ToastBarTimed = function (_a) {
    var time = _a.time, type = _a.type, id = _a.id, message = _a.message;
    var dismissToastMessage = (0, ToastBarContext_1.useToastBarDismiss)();
    var _b = (0, react_timing_hooks_1.useCountdown)(time, 0, {
        onEnd: function () { return dismissToastMessage(id); },
        startOnMount: true,
    }), _c = _b[1], isPaused = _c.isPaused, pause = _c.pause, resume = _c.resume;
    return ((0, jsx_runtime_1.jsx)(fuselage_1.ToastBar, { variant: type, onPointerEnter: function () { return pause(); }, onPointerLeave: function () { return resume(); }, children: message, onClose: dismissToastMessage, id: id, time: time, isPaused: isPaused }));
};
exports.default = ToastBarTimed;
//# sourceMappingURL=ToastBarTimed.js.map