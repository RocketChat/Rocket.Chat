var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var Box,CheckBox,Icon,Option,SearchInput,Tile;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v},CheckBox:function(v){CheckBox=v},Icon:function(v){Icon=v},Option:function(v){Option=v},SearchInput:function(v){SearchInput=v},Tile:function(v){Tile=v}},1);var Fragment,useCallback,useState;module.link('react',{Fragment:function(v){Fragment=v},useCallback:function(v){useCallback=v},useState:function(v){useState=v}},2);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},3);var useFilteredOptions;module.link('./useFilteredOptions',{useFilteredOptions:function(v){useFilteredOptions=v}},4);




const MultiSelectCustomList = ({ options, onSelected, searchBarText, }) => {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const handleChange = useCallback((event) => setText(event.currentTarget.value), []);
    const filteredOptions = useFilteredOptions(text, options);
    return (_jsxs(Tile, { overflow: 'auto', pb: 12, pi: 0, elevation: '2', w: 'full', bg: 'light', borderRadius: 2, maxHeight: '50vh', children: [searchBarText && (_jsx(Box, { pi: 12, mbe: 12, children: _jsx(SearchInput, { name: 'select-search', placeholder: t(searchBarText), autoComplete: 'off', addon: _jsx(Icon, { name: 'magnifier', size: 'x20' }), onChange: handleChange, value: text }) })), filteredOptions.map((option) => (_jsx(Fragment, { children: option.isGroupTitle || !option.hasOwnProperty('checked') ? (_jsx(Box, { mi: 'x10', mb: 4, fontScale: 'p2b', color: 'default', children: t(option.text) })) : (_jsx(Option, { children: _jsxs(Box, { w: 'full', display: 'flex', justifyContent: 'space-between', is: 'label', children: [t(option.text), _jsx(CheckBox, { checked: option.checked, pi: 0, name: option.text, id: option.id, onChange: () => onSelected(option) })] }) }, option.id)) }, option.id)))] }));
};
module.exportDefault(MultiSelectCustomList);
//# sourceMappingURL=MultiSelectCustomList.js.map