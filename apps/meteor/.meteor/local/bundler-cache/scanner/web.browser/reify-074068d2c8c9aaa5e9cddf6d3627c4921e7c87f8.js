let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let AutoComplete,Option,Box,Chip;module.link('@rocket.chat/fuselage',{AutoComplete(v){AutoComplete=v},Option(v){Option=v},Box(v){Box=v},Chip(v){Chip=v}},1);let useDebouncedValue;module.link('@rocket.chat/fuselage-hooks',{useDebouncedValue(v){useDebouncedValue=v}},2);let UserAvatar;module.link('@rocket.chat/ui-avatar',{UserAvatar(v){UserAvatar=v}},3);let useEndpoint;module.link('@rocket.chat/ui-contexts',{useEndpoint(v){useEndpoint=v}},4);let useQuery;module.link('@tanstack/react-query',{useQuery(v){useQuery=v}},5);let memo,useMemo,useState;module.link('react',{memo(v){memo=v},useMemo(v){useMemo=v},useState(v){useState=v}},6);var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
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







const query = (term = '', conditions = {}) => ({ selector: JSON.stringify({ term, conditions }) });
const UserAutoComplete = (_a) => {
    var { value, onChange } = _a, props = __rest(_a, ["value", "onChange"]);
    const { conditions = {} } = props;
    const [filter, setFilter] = useState('');
    const debouncedFilter = useDebouncedValue(filter, 1000);
    const usersAutoCompleteEndpoint = useEndpoint('GET', '/v1/users.autocomplete');
    const { data } = useQuery(['usersAutoComplete', debouncedFilter, conditions], () => __awaiter(void 0, void 0, void 0, function* () { return usersAutoCompleteEndpoint(query(debouncedFilter, conditions)); }));
    const options = useMemo(() => (data === null || data === void 0 ? void 0 : data.items.map((user) => ({ value: user.username, label: user.name || user.username }))) || [], [data]);
    return (_jsx(AutoComplete, Object.assign({}, props, { value: value, onChange: onChange, filter: filter, setFilter: setFilter, "data-qa-id": 'UserAutoComplete', renderSelected: ({ selected: { value, label } }) => (_jsxs(Chip, { height: 'x20', value: value, mie: 4, children: [_jsx(UserAvatar, { size: 'x20', username: value }), _jsx(Box, { verticalAlign: 'middle', is: 'span', margin: 'none', mi: 4, children: label })] })), renderItem: (_a) => {
            var { value, label } = _a, props = __rest(_a, ["value", "label"]);
            return (_jsx(Option, Object.assign({ label: label, avatar: _jsx(UserAvatar, { size: 'x20', username: value }) }, props), value));
        }, options: options })));
};
module.exportDefault(memo(UserAutoComplete));
//# sourceMappingURL=UserAutoComplete.js.map