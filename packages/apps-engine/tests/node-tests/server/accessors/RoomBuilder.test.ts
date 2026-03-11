import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IRoom } from '../../../../src/definition/rooms';
import { RoomType } from '../../../../src/definition/rooms';
import { RoomBuilder } from '../../../../src/server/accessors';
import { TestData } from '../../../test-data/utilities';

describe('RoomBuilder', () => {
	it('basicRoomBuilder', () => {
		assert.doesNotThrow(() => new RoomBuilder());
		assert.doesNotThrow(() => new RoomBuilder(TestData.getRoom()));
	});

	it('settingOnRoomBuilder', () => {
		const rbOnce = new RoomBuilder();

		// setData just replaces the passed in object, so let's treat it differently
		assert.strictEqual(rbOnce.setData({ displayName: 'Testing Channel' } as IRoom), rbOnce);
		assert.strictEqual((rbOnce as any).room.displayName, 'Testing Channel');

		const room: IRoom = {} as IRoom;
		const rb = new RoomBuilder(room);
		assert.strictEqual(rb.setDisplayName('Just a Test'), rb);
		assert.deepStrictEqual(room.displayName, 'Just a Test');
		assert.deepStrictEqual(rb.getDisplayName(), 'Just a Test');

		assert.strictEqual(rb.setSlugifiedName('just_a_test'), rb);
		assert.deepStrictEqual(room.slugifiedName, 'just_a_test');
		assert.deepStrictEqual(rb.getSlugifiedName(), 'just_a_test');

		assert.strictEqual(rb.setType(RoomType.CHANNEL), rb);
		assert.deepStrictEqual(room.type, RoomType.CHANNEL);
		assert.deepStrictEqual(rb.getType(), RoomType.CHANNEL);

		assert.strictEqual(rb.setCreator(TestData.getUser()), rb);
		assert.deepStrictEqual(room.creator, TestData.getUser());
		assert.deepStrictEqual(rb.getCreator(), TestData.getUser());

		assert.strictEqual(rb.addUsername('testing.username'), rb);
		assert.strictEqual(room.usernames, undefined);
		assert.ok(rb.getUsernames().length > 0);
		assert.strictEqual(room.usernames, undefined);
		assert.deepStrictEqual(rb.getUsernames()[0], 'testing.username');
		assert.strictEqual(rb.addUsername('another.username'), rb);
		assert.strictEqual(room.usernames, undefined);
		assert.strictEqual(rb.getUsernames().length, 2);

		assert.strictEqual(rb.setUsernames([]), rb);
		assert.strictEqual(room.usernames, undefined);
		assert.strictEqual(rb.getUsernames().length, 0);

		assert.strictEqual(rb.addMemberToBeAddedByUsername('testing.username'), rb);
		assert.ok(rb.getMembersToBeAddedUsernames().length > 0);
		assert.deepStrictEqual(rb.getMembersToBeAddedUsernames()[0], 'testing.username');
		assert.strictEqual(rb.addMemberToBeAddedByUsername('another.username'), rb);
		assert.strictEqual(rb.getMembersToBeAddedUsernames().length, 2);

		assert.strictEqual(rb.setMembersToBeAddedByUsernames([]), rb);
		assert.strictEqual(rb.getMembersToBeAddedUsernames().length, 0);

		assert.strictEqual(rb.setDefault(true), rb);
		assert.ok(room.isDefault);
		assert.ok(rb.getIsDefault());

		assert.strictEqual(rb.setReadOnly(false), rb);
		assert.ok(!room.isReadOnly);
		assert.ok(!rb.getIsReadOnly());

		assert.strictEqual(rb.setDisplayingOfSystemMessages(true), rb);
		assert.ok(room.displaySystemMessages);
		assert.ok(rb.getDisplayingOfSystemMessages());

		assert.strictEqual(rb.addCustomField('thing', {}), rb);
		assert.ok(Object.keys(room.customFields).length > 0);
		assert.ok(Object.keys(rb.getCustomFields()).length > 0);
		assert.ok(room.customFields.thing !== undefined);
		assert.ok(rb.getCustomFields().thing !== undefined);
		assert.strictEqual(rb.addCustomField('another', { thingy: 'two' }), rb);
		assert.deepStrictEqual(room.customFields.another, { thingy: 'two' });
		assert.deepStrictEqual(rb.getCustomFields().another, { thingy: 'two' });

		assert.strictEqual(rb.setCustomFields({}), rb);
		assert.strictEqual(Object.keys(room.customFields).length, 0);
		assert.strictEqual(Object.keys(rb.getCustomFields()).length, 0);

		assert.strictEqual(rb.getRoom(), room);
	});
});
