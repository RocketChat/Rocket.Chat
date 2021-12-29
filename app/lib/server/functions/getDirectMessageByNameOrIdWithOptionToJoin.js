import { getRoomByNameOrIdWithOptionToJoin } from './getRoomByNameOrIdWithOptionToJoin';

export const getDirectMessageByNameOrIdWithOptionToJoin = (args) => getRoomByNameOrIdWithOptionToJoin({ ...args, type: 'd' });

export const getDirectMessageByIdWithOptionToJoin = (args) =>
	getDirectMessageByNameOrIdWithOptionToJoin({ ...args, tryDirectByUserIdOnly: true });
