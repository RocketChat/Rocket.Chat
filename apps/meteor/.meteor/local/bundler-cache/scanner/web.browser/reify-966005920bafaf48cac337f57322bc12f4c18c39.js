let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Chip,AutoComplete,Option,OptionAvatar,OptionContent,OptionDescription;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Chip(v){Chip=v},AutoComplete(v){AutoComplete=v},Option(v){Option=v},OptionAvatar(v){OptionAvatar=v},OptionContent(v){OptionContent=v},OptionDescription(v){OptionDescription=v}},1);let useDebouncedValue;module.link('@rocket.chat/fuselage-hooks',{useDebouncedValue(v){useDebouncedValue=v}},2);let UserAvatar;module.link('@rocket.chat/ui-avatar',{UserAvatar(v){UserAvatar=v}},3);let memo,useCallback,useState;module.link('react',{memo(v){memo=v},useCallback(v){useCallback=v},useState(v){useState=v}},4);let useUiKitState;module.link('../../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},5);let useUsersData;module.link('./hooks/useUsersData',{useUsersData(v){useUsersData=v}},6);var __rest = (this && this.__rest) || function (s, e) {
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







const MultiUsersSelectElement = ({ block, context, }) => {
    var _a;
    const [{ loading, value }, action] = useUiKitState(block, context);
    const [filter, setFilter] = useState('');
    const debouncedFilter = useDebouncedValue(filter, 500);
    const data = useUsersData({ filter: debouncedFilter });
    const handleChange = useCallback((value) => {
        if (Array.isArray(value))
            action({ target: { value } });
    }, [action]);
    return (_jsx(AutoComplete, { value: value || [], options: data, placeholder: (_a = block.placeholder) === null || _a === void 0 ? void 0 : _a.text, disabled: loading, filter: filter, setFilter: setFilter, onChange: handleChange, multiple: true, renderSelected: (_a) => {
            var { selected: { value, label }, onRemove } = _a, props = __rest(_a, ["selected", "onRemove"]);
            return (_jsxs(Chip, Object.assign({}, props, { height: 'x20', value: value, onClick: onRemove, mie: 4, children: [_jsx(UserAvatar, { size: 'x20', username: value }), _jsx(Box, { is: 'span', margin: 'none', mis: 4, children: label })] })));
        }, renderItem: (_a) => {
            var { value, label } = _a, props = __rest(_a, ["value", "label"]);
            return (_jsxs(Option, Object.assign({}, props, { children: [_jsx(OptionAvatar, { children: _jsx(UserAvatar, { username: value, size: 'x20' }) }), _jsxs(OptionContent, { children: [label, " ", _jsxs(OptionDescription, { children: ["(", value, ")"] })] })] }), value));
        } }));
};
module.exportDefault(memo(MultiUsersSelectElement));
//# sourceMappingURL=MultiUsersSelectElement.js.map