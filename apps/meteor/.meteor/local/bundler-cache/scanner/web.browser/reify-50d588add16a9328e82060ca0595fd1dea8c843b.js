module.export({usePreferenceFeaturePreviewList:()=>usePreferenceFeaturePreviewList},true);let useSetting,useUserPreference;module.link('@rocket.chat/ui-contexts',{useSetting(v){useSetting=v},useUserPreference(v){useUserPreference=v}},0);let useMemo;module.link('react',{useMemo(v){useMemo=v}},1);let parseSetting,useFeaturePreviewList;module.link('./useFeaturePreviewList',{parseSetting(v){parseSetting=v},useFeaturePreviewList(v){useFeaturePreviewList=v}},2);


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