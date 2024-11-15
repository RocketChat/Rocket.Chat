module.export({useDefaultSettingFeaturePreviewList:function(){return useDefaultSettingFeaturePreviewList}},true);var useSetting;module.link('@rocket.chat/ui-contexts',{useSetting:function(v){useSetting=v}},0);var useMemo;module.link('react',{useMemo:function(v){useMemo=v}},1);var parseSetting,useFeaturePreviewList;module.link('./useFeaturePreviewList',{parseSetting:function(v){parseSetting=v},useFeaturePreviewList:function(v){useFeaturePreviewList=v}},2);


const useDefaultSettingFeaturePreviewList = () => {
    const featurePreviewSettingJSON = useSetting('Accounts_Default_User_Preferences_featuresPreview');
    const settingFeaturePreview = useMemo(() => parseSetting(featurePreviewSettingJSON), [featurePreviewSettingJSON]);
    return useFeaturePreviewList(settingFeaturePreview !== null && settingFeaturePreview !== void 0 ? settingFeaturePreview : []);
};
//# sourceMappingURL=useDefaultSettingFeaturePreviewList.js.map