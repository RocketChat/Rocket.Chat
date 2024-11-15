module.export({default:()=>AppAvatar});let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let BaseAvatar;module.link('./BaseAvatar',{default(v){BaseAvatar=v}},1);

function AppAvatar({ iconFileContent, iconFileData, size }) {
    return _jsx(BaseAvatar, { size: size, url: iconFileContent || `data:image/png;base64,${iconFileData}` });
}
//# sourceMappingURL=AppAvatar.js.map