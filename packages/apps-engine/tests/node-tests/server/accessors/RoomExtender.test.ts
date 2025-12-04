import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IRoom } from '../../../../src/definition/rooms';
import { RoomExtender } from '../../../../src/server/accessors';
import { TestData } from '../../../test-data/utilities';

describe('RoomExtender', () => {
	it('basicRoomExtender', () => {
		assert.doesNotThrow(() => new RoomExtender({} as IRoom));
		assert.doesNotThrow(() => new RoomExtender(TestData.getRoom()));
	});

	it('usingRoomExtender', () => {
		const room: IRoom = {} as IRoom;
		const re = new RoomExtender(room);

		assert.ok(room.customFields === undefined);
		assert.strictEqual(re.addCustomField('thing', 'value'), re);
		assert.ok(room.customFields !== undefined);
		assert.strictEqual(room.customFields.thing as any, 'value');
		assert.throws(
			() => re.addCustomField('thing', 'second'),
			{
				name: 'Error',
				message: 'The room already contains a custom field by the key: thing',
			},
		);
		assert.throws(
			() => re.addCustomField('thing.', 'second'),
			{
				name: 'Error',
				message: 'The given key contains a period, which is not allowed. Key: thing.',
			},
		);

		assert.ok(room.usernames === undefined);
		assert.strictEqual(re.addMember(TestData.getUser('theId', 'bradley')), re);
		assert.ok(room.usernames === undefined);
		assert.ok(re.getMembersBeingAdded() !== undefined);
		assert.ok(re.getMembersBeingAdded().length > 0);
		assert.ok(re.getMembersBeingAdded()[0].length !== undefined);
		assert.strictEqual(re.getMembersBeingAdded()[0].username, 'bradley');
		assert.throws(
			() => re.addMember(TestData.getUser('theSameUsername', 'bradley')),
			{
				name: 'Error',
				message: 'The user is already in the room.',
			},
		);

		assert.notStrictEqual(re.getRoom(), room);
		assert.deepStrictEqual(re.getRoom(), room);
	});
});
