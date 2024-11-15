let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let useRoomAvatarPath;module.link('@rocket.chat/ui-contexts',{useRoomAvatarPath(v){useRoomAvatarPath=v}},1);let memo;module.link('react',{memo(v){memo=v}},2);let Avatar;module.link('./BaseAvatar',{default(v){Avatar=v}},3);



const RoomAvatar = function RoomAvatar({ room, url, size }) {
    const getRoomPathAvatar = useRoomAvatarPath();
    const urlFromContext = getRoomPathAvatar(room);
    return _jsx(Avatar, { url: url || urlFromContext, size: size });
};
module.exportDefault(memo(RoomAvatar));
//# sourceMappingURL=RoomAvatar.js.map