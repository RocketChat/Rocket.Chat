module.export({OnboardingLogo:()=>OnboardingLogo,OnboardingLogoCloud:()=>OnboardingLogoCloud});let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let TaggedRocketChatLogo,RocketChatLogo;module.link('@rocket.chat/logo',{TaggedRocketChatLogo(v){TaggedRocketChatLogo=v},RocketChatLogo(v){RocketChatLogo=v}},2);var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};



var OnboardingLogo = function () { return (_jsx(Box, __assign({ width: '100%', maxWidth: 224 }, { children: _jsx(RocketChatLogo, {}, void 0) }), void 0)); };
var OnboardingLogoCloud = function () { return (_jsx(Box, __assign({ width: '100%', maxWidth: 224 }, { children: _jsx(TaggedRocketChatLogo, { tagTitle: 'CLOUD' }, void 0) }), void 0)); };
//# sourceMappingURL=OnboardingLogo.js.map