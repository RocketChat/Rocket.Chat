import type { IRoom } from '@rocket.chat/core-typings';

import { FIXTURE_EPOCH, nextFixtureId } from './sequence';

export const createFakeRoom = <T extends IRoom = IRoom>(overrides?: Partial<T>): T =>
	({
		_id: nextFixtureId('room'),
		_updatedAt: FIXTURE_EPOCH,
		t: 'c',
		msgs: 0,
		usersCount: 1,
		...overrides,
		u: {
			_id: 'room-owner',
			username: 'room-owner',
			name: 'Room Owner',
			...overrides?.u,
		},
	}) as T;
