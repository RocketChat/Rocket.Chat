RocketChat.isTheLastMessage = (room, message) => RocketChat.settings.get('Store_Last_Message') && (!room.lastMessage || room.lastMessage._id === message._id);
