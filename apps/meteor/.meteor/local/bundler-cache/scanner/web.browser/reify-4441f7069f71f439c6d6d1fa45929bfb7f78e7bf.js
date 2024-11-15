module.export({useStringFromTextObject:()=>useStringFromTextObject},true);let useCallback;module.link('react',{useCallback(v){useCallback=v}},0);let useAppTranslation;module.link('./useAppTranslation',{useAppTranslation(v){useAppTranslation=v}},1);

const useStringFromTextObject = () => {
    const { t } = useAppTranslation();
    return useCallback((textObject) => {
        if (!textObject) {
            return undefined;
        }
        return textObject.i18n
            ? t === null || t === void 0 ? void 0 : t(textObject.i18n.key, Object.assign({}, textObject.i18n.args))
            : textObject.text;
    }, [t]);
};
//# sourceMappingURL=useStringFromTextObject.js.map