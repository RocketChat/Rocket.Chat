module.export({TooltipComponent:()=>TooltipComponent},true);let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Tooltip,PositionAnimated,AnimatedVisibility;module.link('@rocket.chat/fuselage',{Tooltip(v){Tooltip=v},PositionAnimated(v){PositionAnimated=v},AnimatedVisibility(v){AnimatedVisibility=v}},1);let useRef;module.link('react',{useRef(v){useRef=v}},2);


const TooltipComponent = ({ title, anchor }) => {
    const ref = useRef(anchor);
    return (_jsx(PositionAnimated, { anchor: ref, placement: 'top-middle', margin: 8, visible: AnimatedVisibility.UNHIDING, children: _jsx(Tooltip, { role: 'tooltip', children: title }) }));
};
//# sourceMappingURL=TooltipComponent.js.map