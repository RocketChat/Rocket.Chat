let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let AutoComplete,Box,Chip,Option;module.link('@rocket.chat/fuselage',{AutoComplete(v){AutoComplete=v},Box(v){Box=v},Chip(v){Chip=v},Option(v){Option=v}},1);let useDebouncedValue;module.link('@rocket.chat/fuselage-hooks',{useDebouncedValue(v){useDebouncedValue=v}},2);let UserAvatar;module.link('@rocket.chat/ui-avatar',{UserAvatar(v){UserAvatar=v}},3);let useCallback,useState;module.link('react',{useCallback(v){useCallback=v},useState(v){useState=v}},4);let useUsersData;module.link('./hooks/useUsersData',{useUsersData(v){useUsersData=v}},5);let useUiKitState;module.link('../../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},6);var __rest = (this && this.__rest) || function (s, e) {
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







const UsersSelectElement = ({ block, context }) => {
    var _a;
    const [{ value, loading }, action] = useUiKitState(block, context);
    const [filter, setFilter] = useState('');
    const debouncedFilter = useDebouncedValue(filter, 300);
    const data = useUsersData({ filter: debouncedFilter });
    const handleChange = useCallback((value) => {
        if (!Array.isArray(value))
            action({ target: { value } });
    }, [action]);
    return (_jsx(AutoComplete, { value: value, placeholder: (_a = block.placeholder) === null || _a === void 0 ? void 0 : _a.text, disabled: loading, options: data, onChange: handleChange, filter: filter, setFilter: setFilter, renderSelected: ({ selected: { value, label } }) => (_jsxs(Chip, { height: 'x20', value: value, mie: 4, children: [_jsx(UserAvatar, { size: 'x20', username: value }), _jsx(Box, { verticalAlign: 'middle', is: 'span', margin: 'none', mi: 4, children: label })] })), renderItem: (_a) => {
            var { value, label } = _a, props = __rest(_a, ["value", "label"]);
            return (_jsx(Option, Object.assign({}, props, { label: label, avatar: _jsx(UserAvatar, { username: value, size: 'x20' }) }), value));
        } }));
};
module.exportDefault(UsersSelectElement);
//# sourceMappingURL=UsersSelectElement.js.map