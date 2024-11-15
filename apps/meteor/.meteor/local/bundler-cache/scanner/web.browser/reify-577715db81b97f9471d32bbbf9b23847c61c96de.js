module.export({useVoipDialer:()=>useVoipDialer},true);let useVoipAPI;module.link('./useVoipAPI',{useVoipAPI(v){useVoipAPI=v}},0);let useVoipEvent;module.link('./useVoipEvent',{useVoipEvent(v){useVoipEvent=v}},1);

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