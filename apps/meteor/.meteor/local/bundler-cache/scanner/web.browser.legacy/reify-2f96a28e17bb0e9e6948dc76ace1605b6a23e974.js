module.export({useFilteredOptions:function(){return useFilteredOptions}},true);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},0);
const useFilteredOptions = (optionSearch, options) => {
    const { t } = useTranslation();
    if (!optionSearch)
        return options;
    let filtered = [];
    options.forEach((option) => {
        if (t(option.text)
            .toLowerCase()
            .includes(optionSearch.toLowerCase())) {
            filtered = [...filtered, option];
        }
    });
    return filtered;
};
//# sourceMappingURL=useFilteredOptions.js.map