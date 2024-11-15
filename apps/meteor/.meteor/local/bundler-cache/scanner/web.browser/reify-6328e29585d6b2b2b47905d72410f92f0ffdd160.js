let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let CheckBox;module.link('@rocket.chat/fuselage',{CheckBox(v){CheckBox=v}},1);let useContext;module.link('react',{useContext(v){useContext=v}},2);let MarkupInteractionContext;module.link('../MarkupInteractionContext',{MarkupInteractionContext(v){MarkupInteractionContext=v}},3);let InlineElements;module.link('../elements/InlineElements',{default(v){InlineElements=v}},4);




const TaksListBlock = ({ tasks }) => {
    const { onTaskChecked } = useContext(MarkupInteractionContext);
    return (_jsx("ul", { className: 'task-list', children: tasks.map((item, index) => (_jsxs("li", { children: [_jsx(CheckBox, { checked: item.status, onChange: onTaskChecked === null || onTaskChecked === void 0 ? void 0 : onTaskChecked(item) }), " ", _jsx(InlineElements, { children: item.value })] }, index))) }));
};
module.exportDefault(TaksListBlock);
//# sourceMappingURL=TaskListBlock.js.map