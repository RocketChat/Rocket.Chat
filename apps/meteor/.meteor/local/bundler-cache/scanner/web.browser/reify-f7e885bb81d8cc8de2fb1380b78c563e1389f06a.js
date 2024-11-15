let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Grid;module.link('@rocket.chat/fuselage',{Grid(v){Grid=v}},1);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},2);


const breakpoints = {
    xs: 4,
    sm: 4,
    md: 4,
    lg: 6,
    xl: 6,
};
const Fields = ({ fields, surfaceRenderer }) => (_jsx(Grid, { children: fields.map((field, i) => (_jsx(Grid.Item, Object.assign({}, breakpoints, { children: surfaceRenderer.renderTextObject(field, 0, UiKit.BlockContext.NONE) }), i))) }));
module.exportDefault(Fields);
//# sourceMappingURL=SectionBlock.Fields.js.map