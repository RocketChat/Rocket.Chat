module.export({useAppTranslation:()=>useAppTranslation},true);let useDebugValue;module.link('react',{useDebugValue(v){useDebugValue=v}},0);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},1);let useAppId;module.link('../contexts/AppIdContext',{useAppId(v){useAppId=v}},2);


const useAppTranslation = () => {
    const appId = useAppId();
    const appNs = appId.endsWith(`-core`) ? undefined : `app-${appId}`;
    useDebugValue(appNs);
    return useTranslation(appNs);
};
//# sourceMappingURL=useAppTranslation.js.map