let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let _createElement;module.link("react",{createElement(v){_createElement=v}},1);let Grid;module.link('@rocket.chat/fuselage',{Grid(v){Grid=v}},2);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},3);



const breakpoints = {
    xs: 4,
    sm: 4,
    md: 4,
    lg: 6,
    xl: 6,
};
const Fields = ({ fields, surfaceRenderer }) => (_jsx(Grid, { children: fields.map((field, i) => (_createElement(Grid.Item, Object.assign({}, breakpoints, { key: i }), surfaceRenderer.renderTextObject(field, 0, UiKit.BlockContext.NONE)))) }));
module.exportDefault(Fields);
//# sourceMappingURL=SectionBlock.Fields.js.map