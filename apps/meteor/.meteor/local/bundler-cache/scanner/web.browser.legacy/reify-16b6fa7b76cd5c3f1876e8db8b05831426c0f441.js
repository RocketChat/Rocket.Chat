var _jsx,_Fragment,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},Fragment:function(v){_Fragment=v},jsxs:function(v){_jsxs=v}},0);var IconButton,MenuItem,MenuSection,MenuV2;module.link('@rocket.chat/fuselage',{IconButton:function(v){IconButton=v},MenuItem:function(v){MenuItem=v},MenuSection:function(v){MenuSection=v},MenuV2:function(v){MenuV2=v}},1);var cloneElement;module.link('react',{cloneElement:function(v){cloneElement=v}},2);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},3);var GenericMenuItem;module.link('./GenericMenuItem',{default:function(v){GenericMenuItem=v}},4);var useHandleMenuAction;module.link('./hooks/useHandleMenuAction',{useHandleMenuAction:function(v){useHandleMenuAction=v}},5);var __rest = (this && this.__rest) || function (s, e) {
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






const GenericMenu = (_a) => {
    var { title, icon = 'menu', disabled, onAction, callbackAction, button, className } = _a, props = __rest(_a, ["title", "icon", "disabled", "onAction", "callbackAction", "button", "className"]);
    const { t, i18n } = useTranslation();
    const sections = 'sections' in props && props.sections;
    const items = 'items' in props && props.items;
    const itemsList = sections ? sections.reduce((acc, { items }) => [...acc, ...items], []) : items || [];
    const disabledKeys = itemsList.filter(({ disabled }) => disabled).map(({ id }) => id);
    const handleAction = useHandleMenuAction(itemsList || [], callbackAction);
    const hasIcon = itemsList.some(({ icon }) => icon);
    const handleItems = (items) => hasIcon ? items.map((item) => { var _a; return (Object.assign(Object.assign({}, item), { gap: (_a = item.gap) !== null && _a !== void 0 ? _a : (!item.icon && !item.status) })); }) : items;
    const isMenuEmpty = !(sections && sections.length > 0) && !(items && items.length > 0);
    if (isMenuEmpty || disabled) {
        if (button) {
            // FIXME: deprecate prop `button` as there's no way to ensure it is actually a button
            // (e.g cloneElement could be passing props to a fragment)
            return cloneElement(button, { small: true, icon, disabled, title, className });
        }
        return _jsx(IconButton, { small: true, icon: icon, className: className, title: title, disabled: true });
    }
    return (_jsxs(_Fragment, { children: [sections && (_jsx(MenuV2, Object.assign({ icon: icon, title: i18n.exists(title) ? t(title) : title, onAction: onAction || handleAction, className: className, button: button }, (disabledKeys && { disabledKeys }), props, { children: sections.map(({ title, items }, key) => (_jsx(MenuSection, { title: typeof title === 'string' && i18n.exists(title) ? t(title) : title, items: handleItems(items), children: (item) => (_jsx(MenuItem, { children: _jsx(GenericMenuItem, Object.assign({}, item)) }, item.id)) }, `${title}-${key}`))) }))), items && (_jsx(MenuV2, Object.assign({ icon: icon, title: i18n.exists(title) ? t(title) : title, onAction: onAction || handleAction, className: className, button: button }, (disabledKeys && { disabledKeys }), props, { children: handleItems(items).map((item) => (_jsx(MenuItem, { children: _jsx(GenericMenuItem, Object.assign({}, item)) }, item.id))) })))] }));
};
module.exportDefault(GenericMenu);
//# sourceMappingURL=GenericMenu.js.map