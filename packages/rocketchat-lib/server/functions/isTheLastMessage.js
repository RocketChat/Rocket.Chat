import { settings } from 'meteor/rocketchat:settings';

RocketChat.isTheLastMessage = (room, message) => settings.get('Store_Last_Message') && (!room.lastMessage || room.lastMessage._id === message._id);
