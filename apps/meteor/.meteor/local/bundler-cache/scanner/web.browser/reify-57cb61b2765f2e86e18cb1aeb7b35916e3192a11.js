let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Skeleton;module.link('@rocket.chat/fuselage',{Skeleton(v){Skeleton=v}},1);let Markup;module.link('@rocket.chat/gazzodown',{Markup(v){Markup=v}},2);let parse;module.link('@rocket.chat/message-parser',{parse(v){parse=v}},3);let Suspense;module.link('react',{Suspense(v){Suspense=v}},4);let useAppTranslation;module.link('../hooks/useAppTranslation',{useAppTranslation(v){useAppTranslation=v}},5);





const MarkdownTextElement = ({ textObject }) => {
    const { t } = useAppTranslation();
    const text = textObject.i18n
        ? t(textObject.i18n.key, Object.assign({}, textObject.i18n.args))
        : textObject.text;
    if (!text) {
        return null;
    }
    return (_jsx(Suspense, { fallback: _jsx(Skeleton, {}), children: _jsx(Markup, { tokens: parse(text, { emoticons: false }) }) }));
};
module.exportDefault(MarkdownTextElement);
//# sourceMappingURL=MarkdownTextElement.js.map