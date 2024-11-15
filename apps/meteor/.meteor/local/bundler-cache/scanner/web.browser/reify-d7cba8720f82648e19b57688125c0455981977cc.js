let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Button,Throbber;module.link('@rocket.chat/fuselage',{Button(v){Button=v},Throbber(v){Throbber=v}},1);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},2);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},3);



const ButtonElement = ({ block, context, surfaceRenderer, }) => {
    const [{ loading }, action] = useUiKitState(block, context);
    const { style, url, text, value, secondary } = block;
    const handleClick = (e) => {
        action({ target: e.currentTarget });
    };
    if (url) {
        return (_jsx(Button, { is: 'a', target: '_blank', small: true, minWidth: '4ch', disabled: loading, href: url, primary: style === 'primary', danger: style === 'danger', success: style === 'success', warning: style === 'warning', secondary: secondary, onClick: handleClick, children: loading ? (_jsx(Throbber, {})) : (surfaceRenderer.renderTextObject(text, 0, UiKit.BlockContext.NONE)) }));
    }
    return (_jsx(Button, { small: true, minWidth: '4ch', disabled: loading, primary: style === 'primary', danger: style === 'danger', success: style === 'success', warning: style === 'warning', secondary: secondary, value: value, onClick: handleClick, children: loading ? (_jsx(Throbber, {})) : (surfaceRenderer.renderTextObject(text, 0, UiKit.BlockContext.NONE)) }));
};
module.exportDefault(ButtonElement);
//# sourceMappingURL=ButtonElement.js.map