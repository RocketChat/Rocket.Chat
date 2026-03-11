import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('setUserActiveStatus', () => {
	const userId = 'test-user-id';
	const username = 'testuser';

	const stubs = {
		Users: {
			findOneById: sinon.stub(),
			setUserActive: sinon.stub(),
			findOneAdmin: sinon.stub(),
			countActiveUsersInRoles: sinon.stub(),
			unsetLoginTokens: sinon.stub(),
			unsetReason: sinon.stub(),
			findActiveByUserIds: sinon.stub(),
		},
		Rooms: {
			setDmReadOnlyByUserId: sinon.stub(),
			getDirectConversationsByUserId: sinon.stub(),
		},
		check: sinon.stub(),
		callbacks: {
			run: sinon.stub(),
		},
		settings: {
			get: sinon.stub(),
		},
		notifyOnUserChange: sinon.stub(),
		notifyOnRoomChangedByUserDM: sinon.stub(),
		notifyOnRoomChangedById: sinon.stub(),
		getSubscribedRoomsForUserWithDetails: sinon.stub(),
		shouldRemoveOrChangeOwner: sinon.stub(),
		getUserSingleOwnedRooms: sinon.stub(),
		closeOmnichannelConversations: sinon.stub(),
		relinquishRoomOwnerships: sinon.stub(),
		Mailer: {
			sendNoWrap: sinon.stub(),
		},
		Accounts: {
			emailTemplates: {
				userActivated: {
					subject: sinon.stub(),
					html: sinon.stub(),
				},
			},
		},
		isUserFederated: sinon.stub(),
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
		Object.values(stubs).forEach((stub) => {
			if (typeof stub === 'object' && stub !== null) {
				Object.values(stub).forEach((method) => {
					if (typeof method?.reset === 'function') {
						method.reset();
					}
				});
			} else if (typeof stub?.reset === 'function') {
				stub.reset();
			}
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

			try {
				await setUserActiveStatus(userId, false);
				expect.fail('Should have thrown an error');
			} catch (error: any) {
				expect(error.message).to.equal('error-user-is-federated');
			}
		});
	});
});
