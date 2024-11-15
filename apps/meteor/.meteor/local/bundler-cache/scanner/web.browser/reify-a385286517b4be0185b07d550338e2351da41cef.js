module.export({useFeaturePreview:()=>useFeaturePreview},true);let usePreferenceFeaturePreviewList;module.link('./usePreferenceFeaturePreviewList',{usePreferenceFeaturePreviewList(v){usePreferenceFeaturePreviewList=v}},0);
const useFeaturePreview = (featureName) => {
    const { features } = usePreferenceFeaturePreviewList();
    const currentFeature = features === null || features === void 0 ? void 0 : features.find((feature) => feature.name === featureName);
    return Boolean(currentFeature === null || currentFeature === void 0 ? void 0 : currentFeature.value);
};
//# sourceMappingURL=useFeaturePreview.js.map