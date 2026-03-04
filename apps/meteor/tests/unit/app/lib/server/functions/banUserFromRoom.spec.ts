import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	Rooms: {
		findOneById: sinon.stub(),
		incUsersCountById: sinon.stub(),
	},
	Subscriptions: {
		findOneByRoomIdAndUserId: sinon.stub(),
		banByRoomIdAndUserId: sinon.stub(),
	},
	Users: {
		removeRoomByUserId: sinon.stub(),
	},
};

const messageMock = {
	saveSystemMessage: sinon.stub(),
};

const removeUserFromRolesAsyncMock = sinon.stub();
const notifyOnRoomChangedByIdMock = sinon.stub();
const notifyOnSubscriptionChangedByRoomIdAndUserIdMock = sinon.stub();
const afterBanFromRoomCallbackMock = { run: sinon.stub() };

const meteorErrorMock = class extends Error {
	constructor(message: string) {
		super(message);
	}
};

const { performUserBan, banUserFromRoom } = p.noCallThru().load('../../../../../../app/lib/server/functions/banUserFromRoom.ts', {
	'@rocket.chat/models': modelsMock,
	'@rocket.chat/core-services': { Message: messageMock },
	'meteor/meteor': { Meteor: { Error: meteorErrorMock } },
	'../../../../server/lib/callbacks/afterBanFromRoomCallback': { afterBanFromRoomCallback: afterBanFromRoomCallbackMock },
	'../../../../server/lib/roles/removeUserFromRoles': { removeUserFromRolesAsync: removeUserFromRolesAsyncMock },
	'../lib/notifyListener': {
		notifyOnRoomChangedById: notifyOnRoomChangedByIdMock,
		notifyOnSubscriptionChangedByRoomIdAndUserId: notifyOnSubscriptionChangedByRoomIdAndUserIdMock,
	},
});

describe('banUserFromRoom', () => {
	beforeEach(() => {
		modelsMock.Rooms.findOneById.reset();
		modelsMock.Rooms.incUsersCountById.reset();
		modelsMock.Subscriptions.findOneByRoomIdAndUserId.reset();
		modelsMock.Subscriptions.banByRoomIdAndUserId.reset();
		modelsMock.Users.removeRoomByUserId.reset();
		messageMock.saveSystemMessage.reset();
		removeUserFromRolesAsyncMock.reset();
		notifyOnRoomChangedByIdMock.reset();
		notifyOnSubscriptionChangedByRoomIdAndUserIdMock.reset();
		afterBanFromRoomCallbackMock.run.reset();
	});

	describe('performUserBan', () => {
		it('should return early if no subscription exists', async () => {
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves(null);

			const room = { _id: 'room1', t: 'c' };
			const user = { _id: 'user1', username: 'testuser' };

			await performUserBan(room, user);

			expect(modelsMock.Subscriptions.banByRoomIdAndUserId.called).to.be.false;
			expect(modelsMock.Users.removeRoomByUserId.called).to.be.false;
		});

		it('should throw if user has no username', async () => {
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });

			const room = { _id: 'room1', t: 'c' };
			const user = { _id: 'user1' }; // no username

			await expect(performUserBan(room, user)).to.be.rejectedWith('User must have a username to be banned from the room');
		});

		it('should return early if subscription is already BANNED', async () => {
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1', status: 'BANNED' });

			const room = { _id: 'room1', t: 'c' };
			const user = { _id: 'user1', username: 'testuser' };

			await performUserBan(room, user);

			expect(modelsMock.Subscriptions.banByRoomIdAndUserId.called).to.be.false;
		});

		it('should ban the user subscription', async () => {
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });
			modelsMock.Subscriptions.banByRoomIdAndUserId.resolves();
			modelsMock.Users.removeRoomByUserId.resolves();
			modelsMock.Rooms.incUsersCountById.resolves();
			removeUserFromRolesAsyncMock.resolves();
			messageMock.saveSystemMessage.resolves();

			const room = { _id: 'room1', t: 'c' };
			const user = { _id: 'user1', username: 'testuser' };

			await performUserBan(room, user);

			expect(modelsMock.Subscriptions.banByRoomIdAndUserId.calledWith('room1', 'user1')).to.be.true;
		});

		it('should remove the room from user __rooms array', async () => {
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });
			modelsMock.Subscriptions.banByRoomIdAndUserId.resolves();
			modelsMock.Users.removeRoomByUserId.resolves();
			modelsMock.Rooms.incUsersCountById.resolves();
			removeUserFromRolesAsyncMock.resolves();
			messageMock.saveSystemMessage.resolves();

			const room = { _id: 'room1', t: 'c' };
			const user = { _id: 'user1', username: 'testuser' };

			await performUserBan(room, user);

			expect(modelsMock.Users.removeRoomByUserId.calledWith('user1', 'room1')).to.be.true;
		});

		it('should decrement the room user count', async () => {
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });
			modelsMock.Subscriptions.banByRoomIdAndUserId.resolves();
			modelsMock.Users.removeRoomByUserId.resolves();
			modelsMock.Rooms.incUsersCountById.resolves();
			removeUserFromRolesAsyncMock.resolves();
			messageMock.saveSystemMessage.resolves();

			const room = { _id: 'room1', t: 'c' };
			const user = { _id: 'user1', username: 'testuser' };

			await performUserBan(room, user);

			expect(modelsMock.Rooms.incUsersCountById.calledWith('room1', -1)).to.be.true;
		});

		it('should remove room-scoped roles for channels', async () => {
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });
			modelsMock.Subscriptions.banByRoomIdAndUserId.resolves();
			modelsMock.Users.removeRoomByUserId.resolves();
			modelsMock.Rooms.incUsersCountById.resolves();
			removeUserFromRolesAsyncMock.resolves();
			messageMock.saveSystemMessage.resolves();

			const room = { _id: 'room1', t: 'c' };
			const user = { _id: 'user1', username: 'testuser' };

			await performUserBan(room, user);

			expect(removeUserFromRolesAsyncMock.calledWith('user1', ['moderator', 'owner', 'leader'], 'room1')).to.be.true;
		});

		it('should remove room-scoped roles for private rooms', async () => {
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });
			modelsMock.Subscriptions.banByRoomIdAndUserId.resolves();
			modelsMock.Users.removeRoomByUserId.resolves();
			modelsMock.Rooms.incUsersCountById.resolves();
			removeUserFromRolesAsyncMock.resolves();
			messageMock.saveSystemMessage.resolves();

			const room = { _id: 'room1', t: 'p' };
			const user = { _id: 'user1', username: 'testuser' };

			await performUserBan(room, user);

			expect(removeUserFromRolesAsyncMock.calledWith('user1', ['moderator', 'owner', 'leader'], 'room1')).to.be.true;
		});

		it('should NOT remove room-scoped roles for DMs', async () => {
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });
			modelsMock.Subscriptions.banByRoomIdAndUserId.resolves();
			modelsMock.Users.removeRoomByUserId.resolves();
			modelsMock.Rooms.incUsersCountById.resolves();
			messageMock.saveSystemMessage.resolves();

			const room = { _id: 'room1', t: 'd' };
			const user = { _id: 'user1', username: 'testuser' };

			await performUserBan(room, user);

			expect(removeUserFromRolesAsyncMock.called).to.be.false;
		});

		it('should save system message with byUser when provided', async () => {
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });
			modelsMock.Subscriptions.banByRoomIdAndUserId.resolves();
			modelsMock.Users.removeRoomByUserId.resolves();
			modelsMock.Rooms.incUsersCountById.resolves();
			removeUserFromRolesAsyncMock.resolves();
			messageMock.saveSystemMessage.resolves();

			const room = { _id: 'room1', t: 'c' };
			const user = { _id: 'user1', username: 'testuser' };
			const byUser = { _id: 'admin1', username: 'admin' };

			await performUserBan(room, user, { byUser });

			expect(messageMock.saveSystemMessage.calledOnce).to.be.true;
			const { args } = messageMock.saveSystemMessage.firstCall;
			expect(args[0]).to.equal('user-banned');
			expect(args[1]).to.equal('room1');
			expect(args[2]).to.equal('testuser');
			expect(args[4]).to.deep.include({ u: byUser });
		});

		it('should save system message without byUser when not provided', async () => {
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });
			modelsMock.Subscriptions.banByRoomIdAndUserId.resolves();
			modelsMock.Users.removeRoomByUserId.resolves();
			modelsMock.Rooms.incUsersCountById.resolves();
			removeUserFromRolesAsyncMock.resolves();
			messageMock.saveSystemMessage.resolves();

			const room = { _id: 'room1', t: 'c' };
			const user = { _id: 'user1', username: 'testuser' };

			await performUserBan(room, user);

			expect(messageMock.saveSystemMessage.calledOnce).to.be.true;
			const { args } = messageMock.saveSystemMessage.firstCall;
			expect(args[0]).to.equal('user-banned');
			expect(args[1]).to.equal('room1');
			expect(args[2]).to.equal('testuser');
			expect(args).to.have.lengthOf(4); // no extraData
		});

		it('should notify on subscription and room changes', async () => {
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });
			modelsMock.Subscriptions.banByRoomIdAndUserId.resolves();
			modelsMock.Users.removeRoomByUserId.resolves();
			modelsMock.Rooms.incUsersCountById.resolves();
			removeUserFromRolesAsyncMock.resolves();
			messageMock.saveSystemMessage.resolves();

			const room = { _id: 'room1', t: 'c' };
			const user = { _id: 'user1', username: 'testuser' };

			await performUserBan(room, user);

			expect(notifyOnSubscriptionChangedByRoomIdAndUserIdMock.calledWith('room1', 'user1', 'updated')).to.be.true;
			expect(notifyOnRoomChangedByIdMock.calledWith('room1')).to.be.true;
		});
	});

	describe('banUserFromRoom', () => {
		it('should throw if room does not exist', async () => {
			modelsMock.Rooms.findOneById.resolves(null);

			const user = { _id: 'user1', username: 'testuser' };

			await expect(banUserFromRoom('room1', user)).to.be.rejectedWith('error-invalid-room');
		});

		it('should call performUserBan with correct arguments', async () => {
			const room = { _id: 'room1', t: 'c' };
			modelsMock.Rooms.findOneById.resolves(room);
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });
			modelsMock.Subscriptions.banByRoomIdAndUserId.resolves();
			modelsMock.Users.removeRoomByUserId.resolves();
			modelsMock.Rooms.incUsersCountById.resolves();
			removeUserFromRolesAsyncMock.resolves();
			messageMock.saveSystemMessage.resolves();

			const user = { _id: 'user1', username: 'testuser' };

			await banUserFromRoom('room1', user);

			expect(modelsMock.Subscriptions.banByRoomIdAndUserId.calledWith('room1', 'user1')).to.be.true;
		});
	});
});
