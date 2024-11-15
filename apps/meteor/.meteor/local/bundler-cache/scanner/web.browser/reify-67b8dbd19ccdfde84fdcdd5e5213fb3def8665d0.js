let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Badge;module.link('@rocket.chat/fuselage',{Badge(v){Badge=v}},1);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},2);let usePreferenceFeaturePreviewList;module.link('../../hooks/usePreferenceFeaturePreviewList',{usePreferenceFeaturePreviewList(v){usePreferenceFeaturePreviewList=v}},3);



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