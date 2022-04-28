import * as message from './message';
import * as room from './room';
import * as user from './user';

export const dataInterface = {
	message: message.normalize,
	room: room.normalize,
	user: user.normalize,
};
