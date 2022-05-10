import { IRoom, IUser, VideoConferenceInstructions, DirectCallInstructions } from '@rocket.chat/core-typings';
import { Random } from 'meteor/random';

import { Rooms } from '../../app/models/server/raw';

const startDirectVideoConference = async (caller: IUser['_id'], uids: string[]): Promise<DirectCallInstructions> => {
	const callee = uids.filter((uid) => uid !== caller).pop();
	if (!callee) {
		// Are you trying to call yourself?
		throw new Error('invalid-call-target');
	}

	return {
		type: 'direct',
		callId: Random.id(48),
		callee,
	};
};

export const startVideoConference = async (caller: IUser['_id'], rid: string): Promise<VideoConferenceInstructions> => {
	const room = await Rooms.findOneById<Pick<IRoom, '_id' | 't' | 'uids'>>(rid, { projection: { t: 1, uids: 1 } });

	if (!room) {
		throw new Error('invalid-room');
	}

	if (room.t === 'd' && room.uids && room.uids.length <= 2) {
		return startDirectVideoConference(caller, room.uids);
	}

	throw new Error('Conferece calls have not been implemented yet.');
};
