import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
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

const roomCoordinatorMock = {
	getRoomDirectives: sinon.stub(),
};

const RoomMemberActions = {
	BAN: 'ban',
};

let banUserFromRoomMethod: typeof import('./banUserFromRoom').banUserFromRoomMethod;

before(async () => {
	const moduleMocks = [
		mock.module('@rocket.chat/core-typings', {
			exports: {
				isBannedSubscription: (sub: { status?: string } | null) => sub?.status === 'BANNED',
			},
		}),
		mock.module('./authorization', { exports: { canAccessRoomAsync: canAccessRoomAsyncMock } }),
		mock.module('./authorization/hasPermission', { exports: { hasPermissionAsync: hasPermissionAsyncMock } }),
		mock.module('./authorization/hasRole', { exports: { hasRoleAsync: hasRoleAsyncMock } }),
		mock.module('./rooms/banUserFromRoom', { exports: { banUserFromRoom: banUserFromRoomMock } }),
		mock.module('../../definition/IRoomTypeConfig', { exports: { RoomMemberActions } }),
		mock.module('./rooms/roomCoordinator', { exports: { roomCoordinator: roomCoordinatorMock } }),
	];
	({ banUserFromRoomMethod } = await import('./banUserFromRoom'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

describe('banUserFromRoomMethod', () => {
	before(() => {
		mockModel('Rooms', modelsMock.Rooms);
		mockModel('Subscriptions', modelsMock.Subscriptions);
		mockModel('Users', modelsMock.Users);
		mockModel('Roles', modelsMock.Roles);
	});

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
		expect(banUserFromRoomMock.firstCall.args[2]).to.deep.include({ _id: 'fromUserId', username: 'admin' });
	});
});
