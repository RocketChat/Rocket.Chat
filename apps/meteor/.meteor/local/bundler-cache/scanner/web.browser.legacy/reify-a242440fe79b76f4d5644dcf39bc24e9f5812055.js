var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var IconButton;module.link('@rocket.chat/fuselage',{IconButton:function(v){IconButton=v}},1);var forwardRef;module.link('react',{forwardRef:function(v){forwardRef=v}},2);var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};



// TODO: remove any and type correctly
const HeaderToolbarAction = forwardRef(function HeaderToolbarAction(_a, ref) {
    var { id, icon, action, index, title, 'data-tooltip': tooltip } = _a, props = __rest(_a, ["id", "icon", "action", "index", "title", 'data-tooltip']);
    return (_jsx(IconButton, Object.assign({ "data-qa-id": `ToolBoxAction-${icon}`, ref: ref, onClick: () => action(id), "data-toolbox": index, icon: icon, small: true, position: 'relative', overflow: 'visible' }, (tooltip ? { 'data-tooltip': tooltip, 'title': '' } : { title }), props), id));
});
module.exportDefault(HeaderToolbarAction);
//# sourceMappingURL=HeaderToolbarAction.js.map