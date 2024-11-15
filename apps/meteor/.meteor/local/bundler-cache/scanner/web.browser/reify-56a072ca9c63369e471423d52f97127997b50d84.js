let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let useToolbar;module.link('@react-aria/toolbar',{useToolbar(v){useToolbar=v}},1);let ButtonGroup;module.link('@rocket.chat/fuselage',{ButtonGroup(v){ButtonGroup=v}},2);let useRef;module.link('react',{useRef(v){useRef=v}},3);



const HeaderToolbar = (props) => {
    const ref = useRef(null);
    const { toolbarProps } = useToolbar(props, ref);
    return (_jsx(ButtonGroup, Object.assign({ role: 'toolbar', ref: ref }, toolbarProps, { children: props.children })));
};
module.exportDefault(HeaderToolbar);
//# sourceMappingURL=HeaderToolbar.js.map