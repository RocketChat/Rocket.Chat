let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let StatusBullet;module.link('@rocket.chat/fuselage',{StatusBullet(v){StatusBullet=v}},1);let memo;module.link('react',{memo(v){memo=v}},2);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},3);var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};




function UserStatus(_a) {
    var { small, status } = _a, props = __rest(_a, ["small", "status"]);
    const { t } = useTranslation();
    const size = small ? 'small' : 'large';
    switch (status) {
        case 'online':
            return _jsx(StatusBullet, Object.assign({ size: size, status: status }, props));
        case 'busy':
            return _jsx(StatusBullet, Object.assign({ size: size, status: status }, props));
        case 'away':
            return _jsx(StatusBullet, Object.assign({ size: size, status: status }, props));
        case 'offline':
            return _jsx(StatusBullet, Object.assign({ size: size, status: status }, props));
        case 'disabled':
            return _jsx(StatusBullet, Object.assign({ size: size, status: status }, props));
        default:
            return _jsx(StatusBullet, Object.assign({ size: size, title: t('Loading') }, props));
    }
}
module.exportDefault(memo(UserStatus));
//# sourceMappingURL=UserStatus.js.map