let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let AutoComplete,Option,Box,Chip;module.link('@rocket.chat/fuselage',{AutoComplete(v){AutoComplete=v},Option(v){Option=v},Box(v){Box=v},Chip(v){Chip=v}},1);let useDebouncedValue;module.link('@rocket.chat/fuselage-hooks',{useDebouncedValue(v){useDebouncedValue=v}},2);let RoomAvatar;module.link('@rocket.chat/ui-avatar',{RoomAvatar(v){RoomAvatar=v}},3);let memo,useCallback,useState;module.link('react',{memo(v){memo=v},useCallback(v){useCallback=v},useState(v){useState=v}},4);let useChannelsData;module.link('./hooks/useChannelsData',{useChannelsData(v){useChannelsData=v}},5);let useUiKitState;module.link('../../hooks/useUiKitState',{useUiKitState(v){useUiKitState=v}},6);var __rest = (this && this.__rest) || function (s, e) {
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







const ChannelsSelectElement = ({ block, context, }) => {
    const [{ value, loading }, action] = useUiKitState(block, context);
    const [filter, setFilter] = useState('');
    const filterDebounced = useDebouncedValue(filter, 300);
    const options = useChannelsData({ filter: filterDebounced });
    const handleChange = useCallback((value) => {
        if (!Array.isArray(value))
            action({ target: { value } });
    }, [action]);
    return (_jsx(AutoComplete, { value: value, onChange: handleChange, disabled: loading, filter: filter, setFilter: setFilter, renderSelected: ({ selected: { value, label } }) => (_jsxs(Chip, { height: 'x20', value: value, mie: 4, children: [_jsx(RoomAvatar, { size: 'x20', room: Object.assign({ type: (label === null || label === void 0 ? void 0 : label.type) || 'c', _id: value }, label) }), _jsx(Box, { verticalAlign: 'middle', is: 'span', margin: 'none', mi: 4, children: label.name })] })), renderItem: (_a) => {
            var { value, label } = _a, props = __rest(_a, ["value", "label"]);
            return (_jsx(Option, Object.assign({}, props, { label: label.name, avatar: _jsx(RoomAvatar, Object.assign({ size: 'x20', room: {
                        type: label.type,
                        _id: value,
                        avatarETag: label.avatarETag,
                    } }, props)) }), value));
        }, options: options }));
};
module.exportDefault(memo(ChannelsSelectElement));
//# sourceMappingURL=ChannelsSelectElement.js.map