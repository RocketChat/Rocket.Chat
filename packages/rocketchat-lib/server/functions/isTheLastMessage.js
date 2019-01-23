import { settings } from 'meteor/rocketchat:settings';

export const isTheLastMessage = (room, message) => settings.get('Store_Last_Message') && (!room.lastMessage || room.lastMessage._id === message._id);

RocketChat.isTheLastMessage = isTheLastMessage;
