let Button,Throbber;module.link('@rocket.chat/fuselage',{Button(v){Button=v},Throbber(v){Throbber=v}},0);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},1);let React;module.link('react',{default(v){React=v}},2);let useUiKitState;module.link('../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},3);



var ButtonElement = function (_a) {
    var block = _a.block, context = _a.context, surfaceRenderer = _a.surfaceRenderer;
    var _b = useUiKitState(block, context), loading = _b[0].loading, action = _b[1];
    if (block.url) {
        return (React.createElement(Button, { is: 'a', target: '_blank', href: block.url, disabled: loading, primary: block.style === 'primary', danger: block.style === 'danger', minWidth: '4ch', small: true, onClick: action }, loading ? (React.createElement(Throbber, null)) : (surfaceRenderer.renderTextObject(block.text, 0, UiKit.BlockContext.NONE))));
    }
    return (React.createElement(Button, { disabled: loading, primary: block.style === 'primary', danger: block.style === 'danger', minWidth: '4ch', small: true, value: block.value, onClick: action }, loading ? (React.createElement(Throbber, null)) : (surfaceRenderer.renderTextObject(block.text, 0, UiKit.BlockContext.NONE))));
};
module.exportDefault(ButtonElement);
//# sourceMappingURL=ButtonElement.js.map