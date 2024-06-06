import type { MessageTypesValues, IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { getHiddenSystemMessages } from '../../../../../../app/lib/server/lib/getHiddenSystemMessages';

describe('getHiddenSystemMessages', () => {
	it('should return room.sysMes if it is an array', async () => {
		const room: IRoom = {
			_id: 'roomId',
			sysMes: ['mute_unmute', 'room_changed_description'] as MessageTypesValues[],
			t: 'c',
			msgs: 0,
			u: {} as IUser,
			usersCount: 0,
			_updatedAt: new Date(),
		};

		const result = await getHiddenSystemMessages(room, []);

		expect(result).to.deep.equal(room.sysMes);
	});

	it('should return cached hidden system messages if room.sysMes is not an array', async () => {
		const cachedHiddenSystemMessage: MessageTypesValues[] = ['mute_unmute', 'room_changed_description'];

		const room: IRoom = {
			_id: 'roomId',
			t: 'c',
			msgs: 0,
			u: {} as IUser,
			usersCount: 0,
			_updatedAt: new Date(),
		};

		const result = await getHiddenSystemMessages(room, cachedHiddenSystemMessage);

		expect(result).to.deep.equal(cachedHiddenSystemMessage);
	});

	it('should return an empty array if both room.sysMes and cached hidden system messages are undefined', async () => {
		const room: IRoom = {
			_id: 'roomId',
			t: 'c',
			msgs: 0,
			u: {} as IUser,
			usersCount: 0,
			_updatedAt: new Date(),
		};

		const result = await getHiddenSystemMessages(room, []);

		expect(result).to.deep.equal([]);
	});

	it('should return cached hidden system messages if room.sysMes is null', async () => {
		const cachedHiddenSystemMessage: MessageTypesValues[] = ['room_changed_announcement', 'room_changed_announcement'];

		const room: IRoom = {
			_id: 'roomId',
			sysMes: undefined,
			t: 'c',
			msgs: 0,
			u: {} as IUser,
			usersCount: 0,
			_updatedAt: new Date(),
		};

		const result = await getHiddenSystemMessages(room, cachedHiddenSystemMessage);

		expect(result).to.deep.equal(cachedHiddenSystemMessage);
	});
});
