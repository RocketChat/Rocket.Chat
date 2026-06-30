import { expect } from 'chai';
import { beforeEach, describe, it, vi } from 'vitest';

const { modelsMock, messageMock, removeUserFromRolesAsyncMock, notifyOnRoomChangedByIdMock, notifyOnSubscriptionChangedMock, afterBanFromRoomCallbackMock, meteorErrorMock } =
	vi.hoisted(() => {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const sinon = require('sinon');
		return {
			modelsMock: {
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
			},
			messageMock: {
				saveSystemMessage: sinon.stub(),
			},
			removeUserFromRolesAsyncMock: sinon.stub(),
			notifyOnRoomChangedByIdMock: sinon.stub(),
			notifyOnSubscriptionChangedMock: sinon.stub(),
			afterBanFromRoomCallbackMock: { run: sinon.stub() },
			meteorErrorMock: class extends Error {
				constructor(message: string) {
					super(message);
				}
			},
		};
	});

vi.mock('@rocket.chat/models', () => modelsMock);
vi.mock('@rocket.chat/core-services', () => ({ Message: messageMock }));
vi.mock('meteor/meteor', () => ({ Meteor: { Error: meteorErrorMock } }));
vi.mock('../../../../../../server/lib/callbacks/afterBanFromRoomCallback', () => ({ afterBanFromRoomCallback: afterBanFromRoomCallbackMock }));
vi.mock('../../../../../../server/lib/roles/removeUserFromRoles', () => ({ removeUserFromRolesAsync: removeUserFromRolesAsyncMock }));
vi.mock('../../../../../../app/lib/server/lib/notifyListener', () => ({
	notifyOnRoomChangedById: notifyOnRoomChangedByIdMock,
	notifyOnSubscriptionChanged: notifyOnSubscriptionChangedMock,
}));

const { performUserBan, banUserFromRoom } = await import('../../../../../../app/lib/server/functions/banUserFromRoom');

describe('banUserFromRoom', () => {
	const mockByUser = { _id: 'admin1', username: 'admin' };

	beforeEach(() => {
		modelsMock.Rooms.findOneById.reset();
		modelsMock.Rooms.incUsersCountById.reset();
		modelsMock.Subscriptions.findOneByRoomIdAndUserId.reset();
		modelsMock.Subscriptions.banByRoomIdAndUserId.reset();
		modelsMock.Users.removeRoomByUserId.reset();
		messageMock.saveSystemMessage.reset();
		removeUserFromRolesAsyncMock.reset();
		notifyOnRoomChangedByIdMock.reset();
		notifyOnSubscriptionChangedMock.reset();
		afterBanFromRoomCallbackMock.run.reset();
	});

	describe('performUserBan', () => {
		it('should return early if no subscription exists', async () => {
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves(null);

			const room = { _id: 'room1', t: 'c' };
			const user = { _id: 'user1', username: 'testuser' };

			await performUserBan(room, user, mockByUser);

			expect(modelsMock.Subscriptions.banByRoomIdAndUserId.called).to.be.false;
			expect(modelsMock.Users.removeRoomByUserId.called).to.be.false;
		});

		it('should throw if user has no username', async () => {
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });

			const room = { _id: 'room1', t: 'c' };
			const user = { _id: 'user1' }; // no username

			await expect(performUserBan(room, user, mockByUser)).to.be.rejectedWith('User must have a username to be banned from the room');
		});

		it('should return early if subscription is already BANNED', async () => {
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1', status: 'BANNED' });

			const room = { _id: 'room1', t: 'c' };
			const user = { _id: 'user1', username: 'testuser' };

			await performUserBan(room, user, mockByUser);

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

			await performUserBan(room, user, mockByUser);

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

			await performUserBan(room, user, mockByUser);

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

			await performUserBan(room, user, mockByUser);

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

			await performUserBan(room, user, mockByUser);

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

			await performUserBan(room, user, mockByUser);

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

			await performUserBan(room, user, mockByUser);

			expect(removeUserFromRolesAsyncMock.called).to.be.false;
		});

		it('should save system message including who banned', async () => {
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });
			modelsMock.Subscriptions.banByRoomIdAndUserId.resolves();
			modelsMock.Users.removeRoomByUserId.resolves();
			modelsMock.Rooms.incUsersCountById.resolves();
			removeUserFromRolesAsyncMock.resolves();
			messageMock.saveSystemMessage.resolves();

			const room = { _id: 'room1', t: 'c' };
			const user = { _id: 'user1', username: 'testuser' };
			const byUser = { _id: 'moderator2', username: 'mod' };

			await performUserBan(room, user, byUser);

			expect(messageMock.saveSystemMessage.calledOnce).to.be.true;
			const { args } = messageMock.saveSystemMessage.firstCall;
			expect(args[0]).to.equal('user-banned');
			expect(args[1]).to.equal('room1');
			expect(args[2]).to.equal('testuser');
			expect(args[4]).to.deep.include({ u: byUser });
		});

		it('should notify subscription as removed so client drops the stream', async () => {
			const subscription = { _id: 'sub1', rid: 'room1', u: { _id: 'user1' } };
			modelsMock.Subscriptions.findOneByRoomIdAndUserId.resolves(subscription);
			modelsMock.Subscriptions.banByRoomIdAndUserId.resolves();
			modelsMock.Users.removeRoomByUserId.resolves();
			modelsMock.Rooms.incUsersCountById.resolves();
			removeUserFromRolesAsyncMock.resolves();
			messageMock.saveSystemMessage.resolves();

			const room = { _id: 'room1', t: 'c' };
			const user = { _id: 'user1', username: 'testuser' };

			await performUserBan(room, user, mockByUser);

			expect(notifyOnSubscriptionChangedMock.calledWith(subscription, 'removed')).to.be.true;
			expect(notifyOnRoomChangedByIdMock.calledWith('room1')).to.be.true;
		});
	});

	describe('banUserFromRoom', () => {
		it('should throw if room does not exist', async () => {
			modelsMock.Rooms.findOneById.resolves(null);

			const user = { _id: 'user1', username: 'testuser' };

			await expect(banUserFromRoom('room1', user, mockByUser)).to.be.rejectedWith('error-invalid-room');
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

			await banUserFromRoom('room1', user, mockByUser);

			expect(modelsMock.Subscriptions.banByRoomIdAndUserId.calledWith('room1', 'user1')).to.be.true;
			expect(afterBanFromRoomCallbackMock.run.calledOnce).to.be.true;
			expect(afterBanFromRoomCallbackMock.run.firstCall.args[0]).to.deep.include({
				bannedUser: user,
				userWhoBanned: mockByUser,
			});
			expect(afterBanFromRoomCallbackMock.run.firstCall.args[1]).to.equal(room);
		});
	});
});
