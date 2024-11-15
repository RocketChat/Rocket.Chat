var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var useRoomAvatarPath;module.link('@rocket.chat/ui-contexts',{useRoomAvatarPath:function(v){useRoomAvatarPath=v}},1);var memo;module.link('react',{memo:function(v){memo=v}},2);var Avatar;module.link('./BaseAvatar',{default:function(v){Avatar=v}},3);



const RoomAvatar = function RoomAvatar({ room, url, size }) {
    const getRoomPathAvatar = useRoomAvatarPath();
    const urlFromContext = getRoomPathAvatar(room);
    return _jsx(Avatar, { url: url || urlFromContext, size: size });
};
module.exportDefault(memo(RoomAvatar));
//# sourceMappingURL=RoomAvatar.js.map