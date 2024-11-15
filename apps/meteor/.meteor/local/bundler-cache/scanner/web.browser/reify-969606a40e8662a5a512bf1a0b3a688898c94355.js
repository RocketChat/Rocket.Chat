module.export({useDefaultSettingFeaturePreviewList:()=>useDefaultSettingFeaturePreviewList},true);let useSetting;module.link('@rocket.chat/ui-contexts',{useSetting(v){useSetting=v}},0);let useMemo;module.link('react',{useMemo(v){useMemo=v}},1);let parseSetting,useFeaturePreviewList;module.link('./useFeaturePreviewList',{parseSetting(v){parseSetting=v},useFeaturePreviewList(v){useFeaturePreviewList=v}},2);


const useDefaultSettingFeaturePreviewList = () => {
    const featurePreviewSettingJSON = useSetting('Accounts_Default_User_Preferences_featuresPreview');
    const settingFeaturePreview = useMemo(() => parseSetting(featurePreviewSettingJSON), [featurePreviewSettingJSON]);
    return useFeaturePreviewList(settingFeaturePreview !== null && settingFeaturePreview !== void 0 ? settingFeaturePreview : []);
};
//# sourceMappingURL=useDefaultSettingFeaturePreviewList.js.map