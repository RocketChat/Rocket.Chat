module.export({FeaturePreview:()=>FeaturePreview,FeaturePreviewOn:()=>FeaturePreviewOn,FeaturePreviewOff:()=>FeaturePreviewOff},true);let _jsx,_Fragment;module.link("react/jsx-runtime",{jsx(v){_jsx=v},Fragment(v){_Fragment=v}},0);let Children,Suspense,cloneElement;module.link('react',{Children(v){Children=v},Suspense(v){Suspense=v},cloneElement(v){cloneElement=v}},1);let useFeaturePreview;module.link('../../hooks/useFeaturePreview',{useFeaturePreview(v){useFeaturePreview=v}},2);


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