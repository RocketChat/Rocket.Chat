var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var AnchorPortal;module.link('@rocket.chat/ui-client',{AnchorPortal:function(v){AnchorPortal=v}},1);var memo;module.link('react',{memo:function(v){memo=v}},2);


const voipAnchorId = 'voip-root';
const VoipPopupPortal = ({ children }) => {
    return _jsx(AnchorPortal, { id: voipAnchorId, children: children });
};
module.exportDefault(memo(VoipPopupPortal));
//# sourceMappingURL=VoipPopupPortal.js.map