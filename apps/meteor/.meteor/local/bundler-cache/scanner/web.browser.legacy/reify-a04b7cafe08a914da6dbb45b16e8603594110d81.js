module.export({FeaturePreview:function(){return FeaturePreview},FeaturePreviewOn:function(){return FeaturePreviewOn},FeaturePreviewOff:function(){return FeaturePreviewOff}},true);var _jsx,_Fragment;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},Fragment:function(v){_Fragment=v}},0);var Children,Suspense,cloneElement;module.link('react',{Children:function(v){Children=v},Suspense:function(v){Suspense=v},cloneElement:function(v){cloneElement=v}},1);var useFeaturePreview;module.link('../../hooks/useFeaturePreview',{useFeaturePreview:function(v){useFeaturePreview=v}},2);


const FeaturePreview = ({ feature, disabled = false, children, }) => {
    const featureToggleEnabled = useFeaturePreview(feature) && !disabled;
    const toggledChildren = Children.map(children, (child) => cloneElement(child, {
        featureToggleEnabled,
    }));
    return _jsx(Suspense, { fallback: null, children: toggledChildren });
};
const FeaturePreviewOn = ({ children, featureToggleEnabled }) => (_jsx(_Fragment, { children: featureToggleEnabled && children }));
const FeaturePreviewOff = ({ children, featureToggleEnabled }) => (_jsx(_Fragment, { children: !featureToggleEnabled && children }));
//# sourceMappingURL=FeaturePreview.js.map