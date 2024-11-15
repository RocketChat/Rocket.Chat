var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var Badge;module.link('@rocket.chat/fuselage',{Badge:function(v){Badge=v}},1);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},2);var usePreferenceFeaturePreviewList;module.link('../../hooks/usePreferenceFeaturePreviewList',{usePreferenceFeaturePreviewList:function(v){usePreferenceFeaturePreviewList=v}},3);



const FeaturePreviewBadge = () => {
    const { t } = useTranslation();
    const { unseenFeatures } = usePreferenceFeaturePreviewList();
    if (!unseenFeatures) {
        return null;
    }
    return (_jsx(Badge, { variant: 'primary', "aria-label": t('Unseen_features'), children: unseenFeatures }));
};
module.exportDefault(FeaturePreviewBadge);
//# sourceMappingURL=FeaturePreviewBadge.js.map