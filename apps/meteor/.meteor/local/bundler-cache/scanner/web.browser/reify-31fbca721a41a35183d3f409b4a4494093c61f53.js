let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let AnchorPortal;module.link('@rocket.chat/ui-client',{AnchorPortal(v){AnchorPortal=v}},1);let memo;module.link('react',{memo(v){memo=v}},2);


const voipAnchorId = 'voip-root';
const VoipPopupPortal = ({ children }) => {
    return _jsx(AnchorPortal, { id: voipAnchorId, children: children });
};
module.exportDefault(memo(VoipPopupPortal));
//# sourceMappingURL=VoipPopupPortal.js.map