import { expect } from 'chai';
import proxyquireRaw from 'proxyquire';
import * as sinon from 'sinon';

const proxyquire = proxyquireRaw.noCallThru();

class MeteorError extends Error {
	constructor(
		public error: string,
		public reason: string,
	) {
		super(reason);
	}
}

describe('saveRoomSettings validators', () => {
	let sandbox: sinon.SinonSandbox;
	let hasPermissionAsync: sinon.SinonStub;
	let hasAllPermissionAsync: sinon.SinonStub;
	let getInfoById: sinon.SinonStub;
	let settingsGet: sinon.SinonStub;
	let validators: any;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		hasPermissionAsync = sandbox.stub();
		hasAllPermissionAsync = sandbox.stub();
		getInfoById = sandbox.stub();
		settingsGet = sandbox.stub().returns(false);

		({ validators } = proxyquire('./saveRoomSettings', {
			'meteor/meteor': { Meteor: { Error: MeteorError, methods: sandbox.stub(), userId: sandbox.stub() } },
			'meteor/check': { Match: { test: () => true, Optional: {} } },
			'@rocket.chat/core-services': {
				Team: { getInfoById },
			},
			'@rocket.chat/models': { Rooms: {}, Users: {} },
			'../../../../server/lib/rooms/roomCoordinator': {
				roomCoordinator: { getRoomDirectives: () => ({ allowRoomSettingChange: () => true }) },
			},
			'../../../authorization/server/functions/hasPermission': {
				hasPermissionAsync,
				hasAllPermissionAsync,
			},
			'../../../settings/server': { settings: { get: settingsGet } },
			'../../../lib/server/functions/setRoomAvatar': { setRoomAvatar: sandbox.stub() },
			'../../../lib/server/lib/notifyListener': { notifyOnRoomChangedById: sandbox.stub() },
			'../../../../definition/IRoomTypeConfig': { RoomSettingsEnum: {} },
			'../functions/saveReactWhenReadOnly': { saveReactWhenReadOnly: sandbox.stub() },
			'../functions/saveRoomAnnouncement': { saveRoomAnnouncement: sandbox.stub() },
			'../functions/saveRoomCustomFields': { saveRoomCustomFields: sandbox.stub() },
			'../functions/saveRoomDescription': { saveRoomDescription: sandbox.stub() },
			'../functions/saveRoomEncrypted': { saveRoomEncrypted: sandbox.stub() },
			'../functions/saveRoomName': { saveRoomName: sandbox.stub() },
			'../functions/saveRoomReadOnly': { saveRoomReadOnly: sandbox.stub() },
			'../functions/saveRoomSystemMessages': { saveRoomSystemMessages: sandbox.stub() },
			'../functions/saveRoomTopic': { saveRoomTopic: sandbox.stub() },
			'../functions/saveRoomType': { saveRoomType: sandbox.stub() },
		}));
	});

	afterEach(() => sandbox.restore());

	describe('roomType validator', () => {
		describe('non-team room', () => {
			const userId = 'user1';
			const room = { _id: 'room1', t: 'p' };

			it('should do nothing when the type is unchanged', async () => {
				await expect(validators.roomType({ userId, room, value: 'p' })).to.not.be.rejected;
				sinon.assert.notCalled(hasPermissionAsync);
			});

			it('should throw when changing p → c without create-c', async () => {
				hasPermissionAsync.resolves(false);

				await expect(validators.roomType({ userId, room, value: 'c' })).to.be.rejectedWith(
					MeteorError,
					'Changing a private group to a public channel is not allowed',
				);
			});

			it('should not throw when changing p → c with create-c', async () => {
				hasPermissionAsync.resolves(true);

				await expect(validators.roomType({ userId, room, value: 'c' })).to.not.be.rejected;
			});

			it('should throw when changing c → p without create-p', async () => {
				hasPermissionAsync.resolves(false);
				const channelRoom = { _id: 'room1', t: 'c' };

				await expect(validators.roomType({ userId, room: channelRoom, value: 'p' })).to.be.rejectedWith(
					MeteorError,
					'Changing a public channel to a private room is not allowed',
				);
			});

			it('should not throw when changing c → p with create-p', async () => {
				hasPermissionAsync.resolves(true);
				const channelRoom = { _id: 'room1', t: 'c' };

				await expect(validators.roomType({ userId, room: channelRoom, value: 'p' })).to.not.be.rejected;
			});
		});

		describe('team room', () => {
			const userId = 'user1';
			const teamRoomId = 'team-room-id';
			const room = { _id: 'room1', t: 'p', teamId: 'team1' };

			beforeEach(() => {
				hasPermissionAsync.resolves(true);
				getInfoById.resolves({ _id: 'team1', roomId: teamRoomId });
			});

			it('should not throw when changing p → c with both create-team-channel and create-c', async () => {
				hasAllPermissionAsync.resolves(true);

				await expect(validators.roomType({ userId, room, value: 'c' })).to.not.be.rejected;

				sinon.assert.calledWith(hasAllPermissionAsync, userId, ['create-team-channel', 'create-c'], teamRoomId);
			});

			it('should throw when changing p → c without create-team-channel or create-c', async () => {
				hasAllPermissionAsync.resolves(false);

				await expect(validators.roomType({ userId, room, value: 'c' })).to.be.rejectedWith(
					MeteorError,
					"Changing a team's private group to a public channel is not allowed",
				);
			});

			it('should not throw when changing c → p with both create-team-group and create-p', async () => {
				hasAllPermissionAsync.resolves(true);
				const channelRoom = { _id: 'room1', t: 'c', teamId: 'team1' };

				await expect(validators.roomType({ userId, room: channelRoom, value: 'p' })).to.not.be.rejected;

				sinon.assert.calledWith(hasAllPermissionAsync, userId, ['create-team-group', 'create-p'], teamRoomId);
			});

			it('should throw when changing c → p without create-team-group or create-p', async () => {
				hasAllPermissionAsync.resolves(false);
				const channelRoom = { _id: 'room1', t: 'c', teamId: 'team1' };

				await expect(validators.roomType({ userId, room: channelRoom, value: 'p' })).to.be.rejectedWith(
					MeteorError,
					"Changing a team's public channel to a private room is not allowed",
				);
			});
		});
	});
});
