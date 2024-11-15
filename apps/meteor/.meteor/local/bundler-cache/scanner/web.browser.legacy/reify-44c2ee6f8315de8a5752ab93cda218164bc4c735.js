var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var Avatar,Box;module.link('@rocket.chat/fuselage',{Avatar:function(v){Avatar=v},Box:function(v){Box=v}},1);var useUserAvatarPath;module.link('@rocket.chat/ui-contexts',{useUserAvatarPath:function(v){useUserAvatarPath=v}},2);var memo;module.link('react',{memo:function(v){memo=v}},3);



const MAX_USERS = 3;
const VideoConfMessageUserStack = ({ users }) => {
    const getUserAvatarPath = useUserAvatarPath();
    return (_jsx(Box, { mi: 4, children: _jsx(Box, { display: 'flex', alignItems: 'center', mi: 'neg-x2', children: users.slice(0, MAX_USERS).map(({ username }, index) => (_jsx(Box, { mi: 2, children: _jsx(Avatar, { size: 'x28', alt: username || '', "data-tooltip": username, url: getUserAvatarPath(username) }) }, index))) }) }));
};
module.exportDefault(memo(VideoConfMessageUserStack));
//# sourceMappingURL=VideoConfMessageUserStack.js.map