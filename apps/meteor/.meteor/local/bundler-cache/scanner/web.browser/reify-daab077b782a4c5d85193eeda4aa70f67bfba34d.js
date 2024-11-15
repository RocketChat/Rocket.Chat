let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Callout;module.link('@rocket.chat/fuselage',{Callout(v){Callout=v}},1);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},2);


const CalloutBlock = ({ block, surfaceRenderer, }) => {
    var _a;
    return (_jsx(Callout, { type: block.variant, title: (_a = block.title) === null || _a === void 0 ? void 0 : _a.text, actions: (block.accessory &&
            surfaceRenderer.renderSectionAccessoryBlockElement(block.accessory, 0)) ||
            undefined, children: surfaceRenderer.renderTextObject(block.text, 0, UiKit.BlockContext.NONE) }));
};
module.exportDefault(CalloutBlock);
//# sourceMappingURL=CalloutBlock.js.map