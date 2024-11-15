var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var useToolbar;module.link('@react-aria/toolbar',{useToolbar:function(v){useToolbar=v}},1);var ButtonGroup;module.link('@rocket.chat/fuselage',{ButtonGroup:function(v){ButtonGroup=v}},2);var useRef;module.link('react',{useRef:function(v){useRef=v}},3);



const MessageComposerToolbarActions = (props) => {
    const ref = useRef(null);
    const { toolbarProps } = useToolbar(props, ref);
    return (_jsx(ButtonGroup, Object.assign({ role: 'toolbar', small: true, ref: ref }, toolbarProps, { children: props.children })));
};
module.exportDefault(MessageComposerToolbarActions);
//# sourceMappingURL=MessageComposerToolbarActions.js.map