let _Fragment,_jsx;module.link("react/jsx-runtime",{Fragment(v){_Fragment=v},jsx(v){_jsx=v}},0);let useAppTranslation;module.link('../hooks/useAppTranslation',{useAppTranslation(v){useAppTranslation=v}},1);

const PlainTextElement = ({ textObject }) => {
    const { t } = useAppTranslation();
    const text = textObject.i18n
        ? t(textObject.i18n.key, Object.assign({}, textObject.i18n.args))
        : textObject.text;
    return _jsx(_Fragment, { children: text });
};
module.exportDefault(PlainTextElement);
//# sourceMappingURL=PlainTextElement.js.map