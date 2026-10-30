import { beforeEach, describe, it } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
import p from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const owner = { _id: 'owner', username: 'owner', name: 'Owner', e2e: { public_key: 'owner-key' } };
const memberWithKey = { _id: 'member-a', username: 'member-a', e2e: { public_key: 'key-a' } };
const memberWithoutKey = { _id: 'member-b', username: 'member-b' };

const modelsMock = {
	Rooms: {
		createWithFullRoomData: sandbox.stub(),
		incUsersCountById: sandbox.stub(),
		addUserIdsToE2EEQueueByRoomId: sandbox.stub(),
	},
	Subscriptions: {
		createWithRoomAndManyUsers: sandbox.stub(),
	},
	Users: {
		findUsersByUsernames: sandbox.stub(),
		addRoomByUserIds: sandbox.stub(),
		assignRoomRolePrioritiesByUserIdPriorityMap: sandbox.stub(),
	},
};

const settingsMock = { get: sandbox.stub() };
const notifyOnRoomChangedByIdMock = sandbox.stub();
const noopCallback = { run: sandbox.stub().resolves() };

const { createRoom } = p.noCallThru().load('./createRoom.ts', {
	'@rocket.chat/apps': { Apps: { self: undefined, triggerEvent: sandbox.stub().resolves(undefined) }, AppEvents: {} },
	'@rocket.chat/apps-engine/definition/exceptions': { AppsEngineException: class {} },
	'@rocket.chat/core-services': {
		ClientSafeError,
		FederationMatrix: {},
		Message: { saveSystemMessage: sandbox.stub() },
		Room: {},
		Team: { getOneById: sandbox.stub() },
		XMPPServer: {},
	},
	'@rocket.chat/core-typings': { isRoomXMPPHostedMuc: () => false, isUserNativeFederated: () => false },
	'@rocket.chat/models': modelsMock,
	'@rocket.chat/tools': { isBareJid: () => false, normalizeBareJid: (value: string) => value },
	'./createDirectRoom': { createDirectRoom: sandbox.stub() },
	'./filterUsersAllowedInRoom': { filterUsersAllowedInRoom: sandbox.stub() },
	'../../../lib/roles/calculateRoomRolePriorityFromRoles': { calculateRoomRolePriorityFromRoles: () => 0 },
	'../callbacks': { callbacks: { run: sandbox.stub().resolves(), runAsync: sandbox.stub() } },
	'../callbacks/afterCreateRoomCallback': { afterCreateRoomCallback: noopCallback },
	'../callbacks/beforeAddUserToRoom': { beforeAddUserToRoom: noopCallback },
	'../callbacks/beforeCreateRoomCallback': { beforeCreateRoomCallback: noopCallback, prepareCreateRoomCallback: noopCallback },
	'../getSubscriptionAutotranslateDefaultConfig': { getSubscriptionAutotranslateDefaultConfig: () => ({}) },
	'../notifyListener': {
		notifyOnRoomChanged: sandbox.stub(),
		notifyOnRoomChangedById: notifyOnRoomChangedByIdMock,
		notifyOnSubscriptionChangedById: sandbox.stub(),
	},
	'../roles/syncRoomRolePriority': { syncRoomRolePriorityForUserAndRoom: sandbox.stub() },
	'../../settings': { settings: settingsMock },
	'../utils/lib/getDefaultSubscriptionPref': { getDefaultSubscriptionPref: () => ({}) },
	'../utils/lib/getValidRoomName': { getValidRoomName: async (name: string) => name },
});

describe('createRoom E2EE key queue', () => {
	beforeEach(() => {
		sandbox.resetHistory();
		modelsMock.Users.findUsersByUsernames.returns([owner, memberWithKey, memberWithoutKey]);
		modelsMock.Subscriptions.createWithRoomAndManyUsers.resolves({ insertedIds: {} });
		modelsMock.Rooms.createWithFullRoomData.callsFake(async (props: Record<string, unknown>) => ({ _id: 'room-id', ...props }));
		settingsMock.get.withArgs('E2E_Enable').returns(true);
	});

	it('should queue every initial member that has a public key when the room is encrypted', async () => {
		await createRoom('p', 'secret-group', owner, ['member-a', 'member-b'], false, false, { encrypted: true });

		sinon.assert.calledOnceWithExactly(modelsMock.Rooms.addUserIdsToE2EEQueueByRoomId, 'room-id', ['owner', 'member-a']);
		sinon.assert.calledWith(notifyOnRoomChangedByIdMock, 'room-id');
	});

	it('should not queue members when the room is not encrypted', async () => {
		await createRoom('p', 'plain-group', owner, ['member-a', 'member-b'], false, false, {});

		sinon.assert.notCalled(modelsMock.Rooms.addUserIdsToE2EEQueueByRoomId);
	});

	it('should not queue members when E2E encryption is disabled', async () => {
		settingsMock.get.withArgs('E2E_Enable').returns(false);

		await createRoom('p', 'secret-group', owner, ['member-a', 'member-b'], false, false, { encrypted: true });

		sinon.assert.notCalled(modelsMock.Rooms.addUserIdsToE2EEQueueByRoomId);
	});

	it('should not queue anyone when no initial member has a public key', async () => {
		modelsMock.Users.findUsersByUsernames.returns([memberWithoutKey]);

		await createRoom('p', 'secret-group', owner, ['member-b'], true, false, { encrypted: true });

		sinon.assert.notCalled(modelsMock.Rooms.addUserIdsToE2EEQueueByRoomId);
	});
});
