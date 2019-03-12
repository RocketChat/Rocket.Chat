import { settings } from '/app/settings';

export const isTheLastMessage = (room, message) => settings.get('Store_Last_Message') && (!room.lastMessage || room.lastMessage._id === message._id);
