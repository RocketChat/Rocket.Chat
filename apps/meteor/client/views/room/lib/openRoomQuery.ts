import type { IRoom } from '@rocket.chat/core-typings';
import { getObjectKeys } from '@rocket.chat/tools';

import { roomFields } from '../../../../lib/publishFields';
import { Rooms } from '../../../stores';

/** Keeps only the published room fields in the rooms store and hands back the stored record */
export const storeOpenedRoom = (roomData: IRoom): IRoom => {
	const unsetKeys = getObjectKeys(roomData).filter((key) => !(key in roomFields));
	unsetKeys.forEach((key) => {
		delete roomData[key];
	});
	Rooms.state.store(roomData);

	const room = Rooms.state.get(roomData._id);
	if (!room) {
		throw new TypeError('room is undefined');
	}

	return room;
};

/** Retries opening a room unless the error is a final answer about the room itself */
export const retryOpeningRoomUnless =
	(finalErrors: Array<new (...args: any[]) => Error>) =>
	(failureCount: number, error: Error): boolean => {
		if (finalErrors.some((finalError) => error instanceof finalError)) {
			return false;
		}

		return failureCount < 4;
	};

export const openRoomRetryDelay = (attempt: number): number => Math.min(1000 * 2 ** attempt, 5000);
