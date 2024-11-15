module.export({default:function(){return AppAvatar}});var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var BaseAvatar;module.link('./BaseAvatar',{default:function(v){BaseAvatar=v}},1);

function AppAvatar({ iconFileContent, iconFileData, size }) {
    return _jsx(BaseAvatar, { size: size, url: iconFileContent || `data:image/png;base64,${iconFileData}` });
}
//# sourceMappingURL=AppAvatar.js.map