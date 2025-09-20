import { Callbacks } from './callbacksBase';

export const beforeChangeRoomRole =
	Callbacks.create<(args: { fromUserId: string; userId: string; roomId: string; role: 'moderator' | 'owner' | 'leader' | 'user' }) => void>(
		'beforeChangeRoomRole',
	);
