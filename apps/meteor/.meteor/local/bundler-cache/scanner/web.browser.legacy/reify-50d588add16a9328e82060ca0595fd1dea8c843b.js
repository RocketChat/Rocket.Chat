module.export({usePreferenceFeaturePreviewList:function(){return usePreferenceFeaturePreviewList}},true);var useSetting,useUserPreference;module.link('@rocket.chat/ui-contexts',{useSetting:function(v){useSetting=v},useUserPreference:function(v){useUserPreference=v}},0);var useMemo;module.link('react',{useMemo:function(v){useMemo=v}},1);var parseSetting,useFeaturePreviewList;module.link('./useFeaturePreviewList',{parseSetting:function(v){parseSetting=v},useFeaturePreviewList:function(v){useFeaturePreviewList=v}},2);


const usePreferenceFeaturePreviewList = () => {
    const featurePreviewEnabled = useSetting('Accounts_AllowFeaturePreview');
    const userFeaturesPreviewPreference = useUserPreference('featuresPreview');
    const userFeaturesPreview = useMemo(() => parseSetting(userFeaturesPreviewPreference), [userFeaturesPreviewPreference]);
    const { unseenFeatures, features } = useFeaturePreviewList(userFeaturesPreview !== null && userFeaturesPreview !== void 0 ? userFeaturesPreview : []);
    if (!featurePreviewEnabled) {
        return { unseenFeatures: 0, features: [], featurePreviewEnabled };
    }
    return { unseenFeatures, features, featurePreviewEnabled };
};
//# sourceMappingURL=usePreferenceFeaturePreviewList.js.map