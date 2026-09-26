import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { PermissionDeniedError } from '../../../src/server/errors/PermissionDeniedError';
import { AppPermissionManager } from '../../../src/server/managers/AppPermissionManager';
import { TestsRoomBridge } from '../../test-data/bridges/roomBridge';

const buildRoom = (): IRoom =>
	({
		type: RoomType.PRIVATE_GROUP,
		slugifiedName: 'classified',
		displayName: 'classified',
		creator: { id: 'creator-id' },
		abacAttributes: [{ key: 'clearance', values: ['secret'] }],
	}) as IRoom;

describe('RoomBridge.doCreate', () => {
	let bridge: TestsRoomBridge;
	let create: ReturnType<typeof mock.method>;

	const grantAbacWrite = (granted: boolean) =>
		mock.method(AppPermissionManager, 'hasPermission', (_appId: string, permission: IPermission) =>
			granted || permission.name !== 'abac.write' ? permission : undefined,
		);

	beforeEach(() => {
		bridge = new TestsRoomBridge();
		create = mock.method(bridge, 'create', async () => 'room-id');
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('creates the room with its ABAC attributes when the app holds abac.write', async () => {
		grantAbacWrite(true);

		assert.strictEqual(await bridge.doCreate(buildRoom(), [], 'app-id'), 'room-id');
		assert.deepStrictEqual((create.mock.calls[0].arguments[0] as IRoom).abacAttributes, [{ key: 'clearance', values: ['secret'] }]);
	});

	it('refuses a room with ABAC attributes when the app lacks abac.write', async () => {
		grantAbacWrite(false);

		await assert.rejects(bridge.doCreate(buildRoom(), [], 'app-id'), PermissionDeniedError);
		assert.strictEqual(create.mock.callCount(), 0);
	});

	it('strips unmapped ABAC attributes when the app supplies an empty list', async () => {
		grantAbacWrite(false);
		const room = {
			...buildRoom(),
			abacAttributes: [],
			_unmappedProperties_: { abacAttributes: [{ key: 'clearance', values: ['secret'] }] },
		};

		assert.strictEqual(await bridge.doCreate(room, [], 'app-id'), 'room-id');
		assert.strictEqual(create.mock.calls[0].arguments[0], room);
		assert.strictEqual('abacAttributes' in room, false);
		assert.deepStrictEqual(room._unmappedProperties_, {});
	});
});

describe('RoomBridge.doUpdate and doCreateDiscussion', () => {
	let bridge: TestsRoomBridge;

	beforeEach(() => {
		bridge = new TestsRoomBridge();
		mock.method(AppPermissionManager, 'hasPermission', (_appId: string, permission: IPermission) => permission);
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('strips ABAC attributes on update even when the app holds abac.write', async () => {
		const update = mock.method(bridge, 'update', async () => undefined);
		const room = buildRoom();

		await bridge.doUpdate(room, [], 'app-id');

		assert.strictEqual(update.mock.calls[0].arguments[0], room);
		assert.strictEqual('abacAttributes' in room, false);
	});

	it('strips ABAC attributes on discussion creation even when the app holds abac.write', async () => {
		const createDiscussion = mock.method(bridge, 'createDiscussion', async () => 'discussion-id');
		const room = buildRoom();

		assert.strictEqual(await bridge.doCreateDiscussion(room, undefined, undefined, [], 'app-id'), 'discussion-id');
		assert.strictEqual(createDiscussion.mock.calls[0].arguments[0], room);
		assert.strictEqual('abacAttributes' in room, false);
	});
});
