var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var useMemo;module.link('react',{useMemo:function(v){useMemo=v}},1);

const flattenMarkup = (markup) => {
    switch (markup.type) {
        case 'PLAIN_TEXT':
            return markup.value;
        case 'ITALIC':
        case 'BOLD':
        case 'STRIKE':
            return markup.value.map(flattenMarkup).join('');
        case 'INLINE_CODE':
            return flattenMarkup(markup.value);
        case 'LINK': {
            const label = flattenMarkup(markup.value.label);
            const href = markup.value.src.value;
            return label ? `${label} (${href})` : href;
        }
        default:
            return '';
    }
};
const style = {
    maxWidth: '100%',
};
const ImageElement = ({ src, alt }) => {
    const plainAlt = useMemo(() => flattenMarkup(alt), [alt]);
    return (_jsx("a", { href: src, target: '_blank', rel: 'noopener noreferrer', title: plainAlt, children: _jsx("img", { src: src, "data-title": src, alt: plainAlt, style: style }) }));
};
module.exportDefault(ImageElement);
//# sourceMappingURL=ImageElement.js.map