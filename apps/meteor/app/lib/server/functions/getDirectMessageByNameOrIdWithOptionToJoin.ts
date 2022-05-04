import { getRoomByNameOrIdWithOptionToJoin } from './getRoomByNameOrIdWithOptionToJoin';

export const getDirectMessageByNameOrIdWithOptionToJoin = (args: {}): unknown => getRoomByNameOrIdWithOptionToJoin({ ...args, type: 'd' });

export const getDirectMessageByIdWithOptionToJoin = (args: {}): unknown =>
	getDirectMessageByNameOrIdWithOptionToJoin({ ...args, tryDirectByUserIdOnly: true });
