let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let AutoComplete,Option,Chip,Box;module.link('@rocket.chat/fuselage',{AutoComplete(v){AutoComplete=v},Option(v){Option=v},Chip(v){Chip=v},Box(v){Box=v}},1);let useDebouncedValue;module.link('@rocket.chat/fuselage-hooks',{useDebouncedValue(v){useDebouncedValue=v}},2);let RoomAvatar;module.link('@rocket.chat/ui-avatar',{RoomAvatar(v){RoomAvatar=v}},3);let memo,useCallback,useState;module.link('react',{memo(v){memo=v},useCallback(v){useCallback=v},useState(v){useState=v}},4);let useUiKitState;module.link('../../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},5);let useChannelsData;module.link('./hooks/useChannelsData',{useChannelsData(v){useChannelsData=v}},6);var __rest = (this && this.__rest) || function (s, e) {
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







const MultiChannelsSelectElement = ({ block, context, }) => {
    const [{ value, loading }, action] = useUiKitState(block, context);
    const [filter, setFilter] = useState('');
    const filterDebounced = useDebouncedValue(filter, 300);
    const options = useChannelsData({ filter: filterDebounced });
    const handleChange = useCallback((value) => {
        if (Array.isArray(value))
            action({ target: { value } });
    }, [action]);
    return (_jsx(AutoComplete, { value: value || [], disabled: loading, onChange: handleChange, filter: filter, setFilter: setFilter, multiple: true, renderSelected: (_a) => {
            var { selected: { value, label }, onRemove } = _a, props = __rest(_a, ["selected", "onRemove"]);
            return (_jsxs(Chip, Object.assign({}, props, { value: value, onClick: onRemove, children: [_jsx(RoomAvatar, { size: 'x20', room: Object.assign({ type: (label === null || label === void 0 ? void 0 : label.type) || 'c', _id: value }, label) }), _jsx(Box, { is: 'span', margin: 'none', mis: 4, children: label === null || label === void 0 ? void 0 : label.name })] }), value));
        }, renderItem: (_a) => {
            var { value, label } = _a, props = __rest(_a, ["value", "label"]);
            return (_jsx(Option, Object.assign({}, props, { label: label.name, avatar: _jsx(RoomAvatar, { size: 'x20', room: Object.assign({ type: (label === null || label === void 0 ? void 0 : label.type) || 'c', _id: value }, label) }) }), value));
        }, options: options }));
};
module.exportDefault(memo(MultiChannelsSelectElement));
//# sourceMappingURL=MultiChannelsSelectElement.js.map