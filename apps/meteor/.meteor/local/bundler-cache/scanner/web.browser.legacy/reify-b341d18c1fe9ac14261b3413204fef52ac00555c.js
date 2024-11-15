module.export({TooltipComponent:function(){return TooltipComponent}},true);var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var Tooltip,PositionAnimated,AnimatedVisibility;module.link('@rocket.chat/fuselage',{Tooltip:function(v){Tooltip=v},PositionAnimated:function(v){PositionAnimated=v},AnimatedVisibility:function(v){AnimatedVisibility=v}},1);var useRef;module.link('react',{useRef:function(v){useRef=v}},2);


const TooltipComponent = ({ title, anchor }) => {
    const ref = useRef(anchor);
    return (_jsx(PositionAnimated, { anchor: ref, placement: 'top-middle', margin: 8, visible: AnimatedVisibility.UNHIDING, children: _jsx(Tooltip, { role: 'tooltip', children: title }) }));
};
//# sourceMappingURL=TooltipComponent.js.map