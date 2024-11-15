var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var CheckBox;module.link('@rocket.chat/fuselage',{CheckBox:function(v){CheckBox=v}},1);var useContext;module.link('react',{useContext:function(v){useContext=v}},2);var MarkupInteractionContext;module.link('../MarkupInteractionContext',{MarkupInteractionContext:function(v){MarkupInteractionContext=v}},3);var InlineElements;module.link('../elements/InlineElements',{default:function(v){InlineElements=v}},4);




const TaksListBlock = ({ tasks }) => {
    const { onTaskChecked } = useContext(MarkupInteractionContext);
    return (_jsx("ul", { className: 'task-list', children: tasks.map((item, index) => (_jsxs("li", { children: [_jsx(CheckBox, { checked: item.status, onChange: onTaskChecked === null || onTaskChecked === void 0 ? void 0 : onTaskChecked(item) }), " ", _jsx(InlineElements, { children: item.value })] }, index))) }));
};
module.exportDefault(TaksListBlock);
//# sourceMappingURL=TaskListBlock.js.map