import { expect } from 'chai';
import proxyquireRaw from 'proxyquire';
import * as sinon from 'sinon';

const proxyquire = proxyquireRaw.noCallThru();

type Stubbed = { [k: string]: any };

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
	let stubs: Stubbed;
	let validators: any;

	beforeEach(() => {
		sandbox = sinon.createSandbox();

		stubs = {
			'hasPermissionAsync': sandbox.stub(),
			'@rocket.chat/core-services': {
				Team: { getInfoById: sandbox.stub() },
			},
			'../../../settings/server': {
				settings: { get: sandbox.stub().returns(false) },
			},
		};

		({ validators } = proxyquire('./saveRoomSettings', {
			'meteor/meteor': { Meteor: { Error: MeteorError, methods: sandbox.stub(), userId: sandbox.stub() } },
			'meteor/check': { Match: { test: () => true, Optional: {} } },
			'@rocket.chat/core-services': stubs['@rocket.chat/core-services'],
			'@rocket.chat/models': { Rooms: {}, Users: {} },
			'../../../../server/lib/rooms/roomCoordinator': {
				roomCoordinator: { getRoomDirectives: () => ({ allowRoomSettingChange: () => true }) },
			},
			'../../../authorization/server/functions/hasPermission': {
				hasPermissionAsync: stubs.hasPermissionAsync,
			},
			'../../../settings/server': stubs['../../../settings/server'],
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
				expect(stubs.hasPermissionAsync.called).to.equal(false);
			});

			it('should throw when changing p → c without create-c', async () => {
				stubs.hasPermissionAsync.resolves(false);

				await expect(validators.roomType({ userId, room, value: 'c' })).to.be.rejectedWith(
					MeteorError,
					'Changing a private group to a public channel is not allowed',
				);
			});

			it('should not throw when changing p → c with create-c', async () => {
				stubs.hasPermissionAsync.resolves(true);

				await expect(validators.roomType({ userId, room, value: 'c' })).to.not.be.rejected;
			});

			it('should throw when changing c → p without create-p', async () => {
				stubs.hasPermissionAsync.resolves(false);
				const channelRoom = { _id: 'room1', t: 'c' };

				await expect(validators.roomType({ userId, room: channelRoom, value: 'p' })).to.be.rejectedWith(
					MeteorError,
					'Changing a public channel to a private room is not allowed',
				);
			});

			it('should not throw when changing c → p with create-p', async () => {
				stubs.hasPermissionAsync.resolves(true);
				const channelRoom = { _id: 'room1', t: 'c' };

				await expect(validators.roomType({ userId, room: channelRoom, value: 'p' })).to.not.be.rejected;
			});
		});

		describe('team main room', () => {
			const userId = 'user1';

			it('should not throw when changing p → c with create-c', async () => {
				stubs.hasPermissionAsync.resolves(true);
				const teamMainRoom = { _id: 'room1', t: 'p', teamId: 'team1', teamMain: true };

				await expect(validators.roomType({ userId, room: teamMainRoom, value: 'c' })).to.not.be.rejected;

				expect(stubs.hasPermissionAsync.calledWith(userId, 'create-c')).to.equal(true);
			});

			it('should throw when changing p → c without create-c', async () => {
				stubs.hasPermissionAsync.resolves(false);
				const teamMainRoom = { _id: 'room1', t: 'p', teamId: 'team1', teamMain: true };

				await expect(validators.roomType({ userId, room: teamMainRoom, value: 'c' })).to.be.rejectedWith(
					MeteorError,
					'Changing a private group to a public channel is not allowed',
				);
			});
		});

		describe('team channel room', () => {
			const userId = 'user1';
			const teamRoomId = 'team-room-id';
			const room = { _id: 'room1', t: 'p', teamId: 'team1' };

			beforeEach(() => {
				stubs['@rocket.chat/core-services'].Team.getInfoById.resolves({ _id: 'team1', roomId: teamRoomId });
			});

			it('should not throw when changing p → c with create-team-channel', async () => {
				stubs.hasPermissionAsync.resolves(true);

				await expect(validators.roomType({ userId, room, value: 'c' })).to.not.be.rejected;

				expect(stubs.hasPermissionAsync.calledWith(userId, 'create-team-channel', teamRoomId)).to.equal(true);
			});

			it('should throw when changing p → c without create-team-channel', async () => {
				stubs.hasPermissionAsync.resolves(false);

				await expect(validators.roomType({ userId, room, value: 'c' })).to.be.rejectedWith(
					MeteorError,
					"Changing a team's private group to a public channel is not allowed",
				);
			});

			it('should not throw when changing c → p with create-team-group', async () => {
				stubs.hasPermissionAsync.resolves(true);
				const channelRoom = { _id: 'room1', t: 'c', teamId: 'team1' };

				await expect(validators.roomType({ userId, room: channelRoom, value: 'p' })).to.not.be.rejected;

				expect(stubs.hasPermissionAsync.calledWith(userId, 'create-team-group', teamRoomId)).to.equal(true);
			});

			it('should throw when changing c → p without create-team-group', async () => {
				stubs.hasPermissionAsync.resolves(false);
				const channelRoom = { _id: 'room1', t: 'c', teamId: 'team1' };

				await expect(validators.roomType({ userId, room: channelRoom, value: 'p' })).to.be.rejectedWith(
					MeteorError,
					"Changing a team's public channel to a private room is not allowed",
				);
			});
		});
	});
});
