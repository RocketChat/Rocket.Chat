module.export({MultiSelectCustom:()=>MultiSelectCustom},true);let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let useOutsideClick,useToggle;module.link('@rocket.chat/fuselage-hooks',{useOutsideClick(v){useOutsideClick=v},useToggle(v){useToggle=v}},2);let useCallback,useRef;module.link('react',{useCallback(v){useCallback=v},useRef(v){useRef=v}},3);let MultiSelectCustomAnchor;module.link('./MultiSelectCustomAnchor',{default(v){MultiSelectCustomAnchor=v}},4);let MultiSelectCustomList;module.link('./MultiSelectCustomList',{default(v){MultiSelectCustomList=v}},5);let MultiSelectCustomListWrapper;module.link('./MultiSelectCustomListWrapper',{default(v){MultiSelectCustomListWrapper=v}},6);var __rest = (this && this.__rest) || function (s, e) {
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







const isValidReference = (reference, e) => {
    var _a;
    const isValidTarget = Boolean(e.target);
    const isValidReference = e.target !== reference.current && !((_a = reference.current) === null || _a === void 0 ? void 0 : _a.contains(e.target));
    return isValidTarget && isValidReference;
};
const onMouseEventPreventSideEffects = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
};
const MultiSelectCustom = (_a) => {
    var { dropdownOptions, defaultTitle, selectedOptionsTitle, selectedOptions, setSelectedOptions, searchBarText } = _a, props = __rest(_a, ["dropdownOptions", "defaultTitle", "selectedOptionsTitle", "selectedOptions", "setSelectedOptions", "searchBarText"]);
    const reference = useRef(null);
    const target = useRef(null);
    const [collapsed, toggleCollapsed] = useToggle(false);
    const onClose = useCallback((e) => {
        if (isValidReference(reference, e)) {
            toggleCollapsed(false);
            return;
        }
        onMouseEventPreventSideEffects(e);
    }, [toggleCollapsed]);
    useOutsideClick([target], onClose);
    const onSelect = useCallback((selectedOption, e) => {
        e === null || e === void 0 ? void 0 : e.stopPropagation();
        if (selectedOption.hasOwnProperty('checked')) {
            selectedOption.checked = !selectedOption.checked;
            if (selectedOption.checked) {
                setSelectedOptions([...new Set([...selectedOptions, selectedOption])]);
                return;
            }
            // the user has disabled this option -> remove this from the selected options list
            setSelectedOptions(selectedOptions.filter((option) => option.id !== selectedOption.id));
        }
    }, [selectedOptions, setSelectedOptions]);
    const selectedOptionsCount = dropdownOptions.filter((option) => option.hasOwnProperty('checked') && option.checked).length;
    return (_jsxs(Box, { display: 'flex', position: 'relative', children: [_jsx(MultiSelectCustomAnchor, Object.assign({ ref: reference, collapsed: collapsed, onClick: () => toggleCollapsed(!collapsed), onKeyDown: (e) => (e.code === 'Enter' || e.code === 'Space') && toggleCollapsed(!collapsed), defaultTitle: defaultTitle, selectedOptionsTitle: selectedOptionsTitle, selectedOptionsCount: selectedOptionsCount, maxCount: dropdownOptions.length }, props)), collapsed && (_jsx(MultiSelectCustomListWrapper, { ref: target, children: _jsx(MultiSelectCustomList, { options: dropdownOptions, onSelected: onSelect, searchBarText: searchBarText }) }))] }));
};
//# sourceMappingURL=MultiSelectCustom.js.map