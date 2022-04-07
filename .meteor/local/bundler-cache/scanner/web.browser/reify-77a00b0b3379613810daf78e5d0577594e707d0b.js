let Grid;module.link('@rocket.chat/fuselage',{Grid(v){Grid=v}},0);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},1);let React;module.link('react',{default(v){React=v}},2);var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};



var breakpoints = {
    xs: 4,
    sm: 4,
    md: 4,
    lg: 6,
    xl: 6,
};
var Fields = function (_a) {
    var fields = _a.fields, surfaceRenderer = _a.surfaceRenderer;
    return (React.createElement(Grid, null, fields.map(function (field, i) { return (React.createElement(Grid.Item, __assign({}, breakpoints, { key: i }), surfaceRenderer.renderTextObject(field, 0, UiKit.BlockContext.NONE))); })));
};
module.exportDefault(Fields);
//# sourceMappingURL=SectionBlock.Fields.js.map