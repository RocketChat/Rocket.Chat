var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var getBaseURI,isExternal;module.link('@rocket.chat/ui-client',{getBaseURI:function(v){getBaseURI=v},isExternal:function(v){isExternal=v}},1);var useMemo;module.link('react',{useMemo:function(v){useMemo=v}},2);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},3);var BoldSpan;module.link('./BoldSpan',{default:function(v){BoldSpan=v}},4);var ItalicSpan;module.link('./ItalicSpan',{default:function(v){ItalicSpan=v}},5);var PlainSpan;module.link('./PlainSpan',{default:function(v){PlainSpan=v}},6);var StrikeSpan;module.link('./StrikeSpan',{default:function(v){StrikeSpan=v}},7);







const LinkSpan = ({ href, label }) => {
    const { t } = useTranslation();
    const children = useMemo(() => {
        const labelArray = Array.isArray(label) ? label : [label];
        const labelElements = labelArray.map((child, index) => {
            switch (child.type) {
                case 'PLAIN_TEXT':
                    return _jsx(PlainSpan, { text: child.value }, index);
                case 'STRIKE':
                    return _jsx(StrikeSpan, { children: child.value }, index);
                case 'ITALIC':
                    return _jsx(ItalicSpan, { children: child.value }, index);
                case 'BOLD':
                    return _jsx(BoldSpan, { children: child.value }, index);
                default:
                    return null;
            }
        });
        return labelElements;
    }, [label]);
    if (isExternal(href)) {
        return (_jsx("a", { href: href, title: href, rel: 'noopener noreferrer', target: '_blank', children: children }));
    }
    return (_jsx("a", { href: href, title: t('Go_to_href', { href: href.replace(getBaseURI(), '') }), children: children }));
};
module.exportDefault(LinkSpan);
//# sourceMappingURL=LinkSpan.js.map