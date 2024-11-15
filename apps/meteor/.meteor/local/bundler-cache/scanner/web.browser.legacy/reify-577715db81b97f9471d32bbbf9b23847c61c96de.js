module.export({useVoipDialer:function(){return useVoipDialer}},true);var useVoipAPI;module.link('./useVoipAPI',{useVoipAPI:function(v){useVoipAPI=v}},0);var useVoipEvent;module.link('./useVoipEvent',{useVoipEvent:function(v){useVoipEvent=v}},1);

const useVoipDialer = () => {
    const { openDialer, closeDialer } = useVoipAPI();
    const { open } = useVoipEvent('dialer', { open: false });
    return {
        open,
        openDialer: openDialer || (() => undefined),
        closeDialer: closeDialer || (() => undefined),
    };
};
//# sourceMappingURL=useVoipDialer.js.map