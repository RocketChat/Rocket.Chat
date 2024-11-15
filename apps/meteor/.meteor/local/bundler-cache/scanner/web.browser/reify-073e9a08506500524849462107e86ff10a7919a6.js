let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let getBaseURI,isExternal;module.link('@rocket.chat/ui-client',{getBaseURI(v){getBaseURI=v},isExternal(v){isExternal=v}},1);let useMemo;module.link('react',{useMemo(v){useMemo=v}},2);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},3);let BoldSpan;module.link('./BoldSpan',{default(v){BoldSpan=v}},4);let ItalicSpan;module.link('./ItalicSpan',{default(v){ItalicSpan=v}},5);let PlainSpan;module.link('./PlainSpan',{default(v){PlainSpan=v}},6);let StrikeSpan;module.link('./StrikeSpan',{default(v){StrikeSpan=v}},7);







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