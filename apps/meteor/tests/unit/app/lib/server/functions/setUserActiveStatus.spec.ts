import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('setUserActiveStatus', () => {
	const userId = 'test-user-id';
	const username = 'testuser';

	const sandbox = sinon.createSandbox();

	const stubs = {
		Users: {
			findOneById: sandbox.stub(),
			setUserActive: sandbox.stub(),
			findOneAdmin: sandbox.stub(),
			countActiveUsersInRoles: sandbox.stub(),
			unsetLoginTokens: sandbox.stub(),
			unsetReason: sandbox.stub(),
			findActiveByUserIds: sandbox.stub(),
		},
		Rooms: {
			setDmReadOnlyByUserId: sandbox.stub(),
			getDirectConversationsByUserId: sandbox.stub(),
		},
		check: sandbox.stub(),
		callbacks: {
			run: sandbox.stub(),
		},
		settings: {
			get: sandbox.stub(),
		},
		notifyOnUserChange: sandbox.stub(),
		notifyOnRoomChangedByUserDM: sandbox.stub(),
		notifyOnRoomChangedById: sandbox.stub(),
		getSubscribedRoomsForUserWithDetails: sandbox.stub(),
		shouldRemoveOrChangeOwner: sandbox.stub(),
		getUserSingleOwnedRooms: sandbox.stub(),
		closeOmnichannelConversations: sandbox.stub(),
		relinquishRoomOwnerships: sandbox.stub(),
		Mailer: {
			sendNoWrap: sandbox.stub(),
		},
		Accounts: {
			emailTemplates: {
				userActivated: {
					subject: sandbox.stub(),
					html: sandbox.stub(),
				},
			},
		},
		isUserFederated: sandbox.stub(),
	};

	const { setUserActiveStatus } = proxyquire.noCallThru().load('../../../../../../app/lib/server/functions/setUserActiveStatus', {
		'meteor/check': { check: stubs.check },
		'meteor/meteor': { Meteor: { Error } },
		'meteor/accounts-base': { Accounts: stubs.Accounts },
		'@rocket.chat/core-typings': { isUserFederated: stubs.isUserFederated, isDirectMessageRoom: sinon.stub() },
		'@rocket.chat/models': { Users: stubs.Users, Rooms: stubs.Rooms },
		'./closeOmnichannelConversations': { closeOmnichannelConversations: stubs.closeOmnichannelConversations },
		'./getRoomsWithSingleOwner': {
			shouldRemoveOrChangeOwner: stubs.shouldRemoveOrChangeOwner,
			getSubscribedRoomsForUserWithDetails: stubs.getSubscribedRoomsForUserWithDetails,
		},
		'./getUserSingleOwnedRooms': { getUserSingleOwnedRooms: stubs.getUserSingleOwnedRooms },
		'./relinquishRoomOwnerships': { relinquishRoomOwnerships: stubs.relinquishRoomOwnerships },
		'../../../../server/lib/callbacks': { callbacks: stubs.callbacks },
		'../../../mailer/server/api': stubs.Mailer,
		'../../../settings/server': { settings: stubs.settings },
		'../lib/notifyListener': {
			notifyOnRoomChangedById: stubs.notifyOnRoomChangedById,
			notifyOnRoomChangedByUserDM: stubs.notifyOnRoomChangedByUserDM,
			notifyOnUserChange: stubs.notifyOnUserChange,
		},
	});

	beforeEach(() => {
		stubs.Users.findOneById.resolves({ _id: userId, username, active: true });
		stubs.Users.setUserActive.resolves();
		stubs.Users.unsetLoginTokens.resolves();
		stubs.Users.unsetReason.resolves();
		stubs.isUserFederated.returns(false);
		stubs.Users.findOneAdmin.resolves(null);
		stubs.Users.countActiveUsersInRoles.resolves(2);
		stubs.Users.findActiveByUserIds.returns({ toArray: sinon.stub().resolves([]) });
		stubs.getSubscribedRoomsForUserWithDetails.resolves([]);
		stubs.shouldRemoveOrChangeOwner.returns(false);
		stubs.closeOmnichannelConversations.resolves();
		stubs.relinquishRoomOwnerships.resolves();
		stubs.callbacks.run.resolves();
		stubs.settings.get.returns(false);
		stubs.Rooms.setDmReadOnlyByUserId.resolves({ modifiedCount: 0 });
		stubs.Rooms.getDirectConversationsByUserId.returns({ toArray: sinon.stub().resolves([]) });
		stubs.notifyOnRoomChangedById.returns(undefined);
		stubs.notifyOnUserChange.returns(undefined);
		stubs.notifyOnRoomChangedByUserDM.returns(undefined);
	});

	afterEach(() => {
		sandbox.reset();
	});

	describe('Successful status changes', () => {
		it('should deactivate a user successfully', async () => {
			const result = await setUserActiveStatus(userId, false);

			expect(result).to.be.true;
			expect(stubs.Users.setUserActive.calledWith(userId, false)).to.be.true;
			expect(stubs.Users.unsetLoginTokens.calledWith(userId)).to.be.true;
			expect(stubs.Rooms.setDmReadOnlyByUserId.calledWith(userId, undefined, true, false)).to.be.true;
			expect(stubs.callbacks.run.calledWith('afterDeactivateUser', sinon.match({ _id: userId }))).to.be.true;
			expect(stubs.notifyOnUserChange.calledWith(sinon.match({ clientAction: 'updated', id: userId, diff: { 'services.resume.loginTokens': [], active: false } }))).to.be.true;
			expect(stubs.notifyOnRoomChangedByUserDM.calledWith(userId)).to.be.true;
		});

		it('should activate a user successfully', async () => {
			stubs.Users.findOneById.resolves({ _id: userId, username, active: false });

			const result = await setUserActiveStatus(userId, true);

			expect(result).to.be.true;
			expect(stubs.callbacks.run.calledWith('beforeActivateUser', sinon.match({ _id: userId }))).to.be.true;
			expect(stubs.Users.setUserActive.calledWith(userId, true)).to.be.true;
			expect(stubs.callbacks.run.calledWith('afterActivateUser', sinon.match({ _id: userId }))).to.be.true;
			expect(stubs.Users.unsetReason.calledWith(userId)).to.be.true;
			expect(stubs.notifyOnUserChange.calledWith(sinon.match({ clientAction: 'updated', id: userId, diff: { active: true } }))).to.be.true;
		});
	});

	describe('Error handling and validation', () => {
		it('should return false if user is not found', async () => {
			stubs.Users.findOneById.resolves(null);

			const result = await setUserActiveStatus(userId, false);

			expect(result).to.be.false;
		});

		it('should throw error for federated users', async () => {
			stubs.isUserFederated.returns(true);

			await expect(setUserActiveStatus(userId, false)).to.be.rejectedWith('error-user-is-federated');
		});

		it('should throw error if deactivating the last active admin', async () => {
			stubs.Users.findOneAdmin.resolves({ _id: userId });
			stubs.Users.countActiveUsersInRoles.resolves(1);

			await expect(setUserActiveStatus(userId, false)).to.be.rejectedWith('error-action-not-allowed');
		});

		it('should throw error if user is the last owner of channels without confirmRelinquish', async () => {
			stubs.getSubscribedRoomsForUserWithDetails.resolves([{ t: 'c' }]);
			stubs.shouldRemoveOrChangeOwner.returns(true);
			stubs.getUserSingleOwnedRooms.resolves(['room1']);

			await expect(setUserActiveStatus(userId, false)).to.be.rejectedWith('user-last-owner');
		});
	});
});
