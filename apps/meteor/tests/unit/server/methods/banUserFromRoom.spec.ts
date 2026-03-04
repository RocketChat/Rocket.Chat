import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const hasPermissionAsyncMock = sinon.stub();
const hasRoleAsyncMock = sinon.stub();
const banUserFromRoomMock = sinon.stub();
const canAccessRoomAsyncMock = sinon.stub();

const modelsMock = {
	Rooms: {
		findOneById: sinon.stub(),
	},
	Subscriptions: {
		findOneByRoomIdAndUserId: sinon.stub(),
	},
	Users: {
		findOneById: sinon.stub(),
		findOneByUsernameIgnoringCase: sinon.stub(),
	},
	Roles: {
		countUsersInRole: sinon.stub(),
	},
};

const meteorMethodsMock = sinon.stub();
const meteorErrorMock = class extends Error {
	details: Record<string, any>;

	constructor(error: string, message: string, details?: Record<string, any>) {
		super(error);
		this.message = message || error;
		this.details = details || {};
	}
};
const roomCoordinatorMock = {
	getRoomDirectives: sinon.stub(),
};

const RoomMemberActions = {
	BAN: 'ban',
};

const { banUserFromRoomMethod } = p.noCallThru().load('../../../../server/methods/banUserFromRoom.ts', {
	'@rocket.chat/models': modelsMock,
	'meteor/check': { Match: { ObjectIncluding: sinon.stub() }, check: sinon.stub() },
	'meteor/meteor': { Meteor: { methods: meteorMethodsMock, Error: meteorErrorMock, userId: sinon.stub() } },
	'../../app/authorization/server': { canAccessRoomAsync: canAccessRoomAsyncMock },
	'../../app/authorization/server/functions/hasPermission': { hasPermissionAsync: hasPermissionAsyncMock },
	'../../app/authorization/server/functions/hasRole': { hasRoleAsync: hasRoleAsyncMock },
	'../../app/lib/server/functions/banUserFromRoom': { banUserFromRoom: banUserFromRoomMock },
	'../../definition/IRoomTypeConfig': { RoomMemberActions },
	'../lib/rooms/roomCoordinator': { roomCoordinator: roomCoordinatorMock },
});

describe('banUserFromRoomMethod', () => {
	beforeEach(() => {
		hasPermissionAsyncMock.reset();
		hasRoleAsyncMock.reset();
		banUserFromRoomMock.reset();
		canAccessRoomAsyncMock.reset();
		modelsMock.Rooms.findOneById.reset();
		modelsMock.Subscriptions.findOneByRoomIdAndUserId.reset();
		modelsMock.Users.findOneById.reset();
		modelsMock.Users.findOneByUsernameIgnoringCase.reset();
		modelsMock.Roles.countUsersInRole.reset();
		roomCoordinatorMock.getRoomDirectives.reset();
	});

	it('should throw if user does not have ban-user permission', async () => {
		hasPermissionAsyncMock.resolves(false);

		await expect(banUserFromRoomMethod('fromUserId', { rid: 'room1', username: 'testuser' })).to.be.rejectedWith('Not allowed');
	});

	it('should throw if room does not exist', async () => {
		hasPermissionAsyncMock.resolves(true);
		modelsMock.Rooms.findOneById.resolves(null);

		await expect(banUserFromRoomMethod('fromUserId', { rid: 'room1', username: 'testuser' })).to.be.rejectedWith('Not allowed');
	});

	it('should throw if BAN action is not allowed for the room type', async () => {
		hasPermissionAsyncMock.resolves(true);
		modelsMock.Rooms.findOneById.resolves({ _id: 'room1', t: 'c' });
		roomCoordinatorMock.getRoomDirectives.returns({
			allowMemberAction: sinon.stub().resolves(false),
		});

		await expect(banUserFromRoomMethod('fromUserId', { rid: 'room1', username: 'testuser' })).to.be.rejectedWith('Not allowed');
	});

	it('should throw if fromUser does not exist', async () => {
		hasPermissionAsyncMock.resolves(true);
		modelsMock.Rooms.findOneById.resolves({ _id: 'room1', t: 'c' });
		roomCoordinatorMock.getRoomDirectives.returns({
			allowMemberAction: sinon.stub().resolves(true),
		});
		modelsMock.Users.findOneById.resolves(null);

		await expect(banUserFromRoomMethod('fromUserId', { rid: 'room1', username: 'testuser' })).to.be.rejectedWith('Invalid user');
	});

	it('should throw if fromUser cannot access the room', async () => {
		hasPermissionAsyncMock.resolves(true);
		modelsMock.Rooms.findOneById.resolves({ _id: 'room1', t: 'c' });
		roomCoordinatorMock.getRoomDirectives.returns({
			allowMemberAction: sinon.stub().resolves(true),
		});
		modelsMock.Users.findOneById.resolves({ _id: 'fromUserId', username: 'admin' });
		canAccessRoomAsyncMock.resolves(false);

		await expect(banUserFromRoomMethod('fromUserId', { rid: 'room1', username: 'testuser' })).to.be.rejectedWith(
			'The required "roomId" or "roomName" param provided does not match any group',
		);
	});

	it('should throw if the user to ban does not exist', async () => {
		hasPermissionAsyncMock.resolves(true);
		modelsMock.Rooms.findOneById.resolves({ _id: 'room1', t: 'c' });
		roomCoordinatorMock.getRoomDirectives.returns({
			allowMemberAction: sinon.stub().resolves(true),
		});
		modelsMock.Users.findOneById.resolves({ _id: 'fromUserId', username: 'admin' });
		canAccessRoomAsyncMock.resolves(true);
		modelsMock.Users.findOneByUsernameIgnoringCase.resolves(null);

		await expect(banUserFromRoomMethod('fromUserId', { rid: 'room1', username: 'testuser' })).to.be.rejectedWith('User not found');
	});

	it('should throw if the user to ban is not in the room', async () => {
		hasPermissionAsyncMock.resolves(true);
		modelsMock.Rooms.findOneById.resolves({ _id: 'room1', t: 'c' });
		roomCoordinatorMock.getRoomDirectives.returns({
			allowMemberAction: sinon.stub().resolves(true),
		});
		modelsMock.Users.findOneById.resolves({ _id: 'fromUserId', username: 'admin' });
		canAccessRoomAsyncMock.resolves(true);
		modelsMock.Users.findOneByUsernameIgnoringCase.resolves({ _id: 'bannedUserId', username: 'testuser' });
		modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves(null);

		await expect(banUserFromRoomMethod('fromUserId', { rid: 'room1', username: 'testuser' })).to.be.rejectedWith(
			'User is not in this room',
		);
	});

	it('should throw if user is already banned', async () => {
		hasPermissionAsyncMock.resolves(true);
		modelsMock.Rooms.findOneById.resolves({ _id: 'room1', t: 'c' });
		roomCoordinatorMock.getRoomDirectives.returns({
			allowMemberAction: sinon.stub().resolves(true),
		});
		modelsMock.Users.findOneById.resolves({ _id: 'fromUserId', username: 'admin' });
		canAccessRoomAsyncMock.resolves(true);
		modelsMock.Users.findOneByUsernameIgnoringCase.resolves({ _id: 'bannedUserId', username: 'testuser' });
		modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1', status: 'BANNED' });

		await expect(banUserFromRoomMethod('fromUserId', { rid: 'room1', username: 'testuser' })).to.be.rejectedWith(
			'User is already banned from this room',
		);
	});

	it('should throw if user is the last owner', async () => {
		hasPermissionAsyncMock.resolves(true);
		modelsMock.Rooms.findOneById.resolves({ _id: 'room1', t: 'c' });
		roomCoordinatorMock.getRoomDirectives.returns({
			allowMemberAction: sinon.stub().resolves(true),
		});
		modelsMock.Users.findOneById.resolves({ _id: 'fromUserId', username: 'admin' });
		canAccessRoomAsyncMock.resolves(true);
		modelsMock.Users.findOneByUsernameIgnoringCase.resolves({ _id: 'bannedUserId', username: 'testuser' });
		modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });
		hasRoleAsyncMock.resolves(true);
		modelsMock.Roles.countUsersInRole.resolves(1);

		await expect(banUserFromRoomMethod('fromUserId', { rid: 'room1', username: 'testuser' })).to.be.rejectedWith('You are the last owner');
	});

	it('should allow banning if user is owner but not the last one', async () => {
		hasPermissionAsyncMock.resolves(true);
		modelsMock.Rooms.findOneById.resolves({ _id: 'room1', t: 'c' });
		roomCoordinatorMock.getRoomDirectives.returns({
			allowMemberAction: sinon.stub().resolves(true),
		});
		modelsMock.Users.findOneById.resolves({ _id: 'fromUserId', username: 'admin' });
		canAccessRoomAsyncMock.resolves(true);
		modelsMock.Users.findOneByUsernameIgnoringCase.resolves({ _id: 'bannedUserId', username: 'testuser' });
		modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });
		hasRoleAsyncMock.resolves(true);
		modelsMock.Roles.countUsersInRole.resolves(2);
		banUserFromRoomMock.resolves();

		const result = await banUserFromRoomMethod('fromUserId', { rid: 'room1', username: 'testuser' });

		expect(result).to.be.true;
		expect(banUserFromRoomMock.calledOnce).to.be.true;
	});

	it('should successfully ban a user and return true', async () => {
		hasPermissionAsyncMock.resolves(true);
		modelsMock.Rooms.findOneById.resolves({ _id: 'room1', t: 'c' });
		roomCoordinatorMock.getRoomDirectives.returns({
			allowMemberAction: sinon.stub().resolves(true),
		});
		modelsMock.Users.findOneById.resolves({ _id: 'fromUserId', username: 'admin' });
		canAccessRoomAsyncMock.resolves(true);
		modelsMock.Users.findOneByUsernameIgnoringCase.resolves({ _id: 'bannedUserId', username: 'testuser' });
		modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });
		hasRoleAsyncMock.resolves(false);
		banUserFromRoomMock.resolves();

		const result = await banUserFromRoomMethod('fromUserId', { rid: 'room1', username: 'testuser' });

		expect(result).to.be.true;
		expect(banUserFromRoomMock.calledOnce).to.be.true;
		expect(banUserFromRoomMock.firstCall.args[0]).to.equal('room1');
		expect(banUserFromRoomMock.firstCall.args[1]).to.deep.include({ _id: 'bannedUserId', username: 'testuser' });
		expect(banUserFromRoomMock.firstCall.args[2]).to.deep.include({ byUser: { _id: 'fromUserId', username: 'admin' } });
	});
});
