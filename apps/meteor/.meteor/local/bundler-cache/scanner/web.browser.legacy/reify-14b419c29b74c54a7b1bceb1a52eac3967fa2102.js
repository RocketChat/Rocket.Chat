module.export({useHandleMenuAction:function(){return useHandleMenuAction}},true);var useEffectEvent;module.link('@rocket.chat/fuselage-hooks',{useEffectEvent:function(v){useEffectEvent=v}},0);
const useHandleMenuAction = (items, callbackAction) => useEffectEvent((id) => {
    var _a;
    const item = items.find((item) => item.id === id && !!item.onClick);
    if (item) {
        (_a = item.onClick) === null || _a === void 0 ? void 0 : _a.call(item);
        callbackAction === null || callbackAction === void 0 ? void 0 : callbackAction();
    }
});
//# sourceMappingURL=useHandleMenuAction.js.map