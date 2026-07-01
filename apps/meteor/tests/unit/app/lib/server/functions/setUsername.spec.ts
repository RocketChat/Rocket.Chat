import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';
import { describe, it, beforeEach, afterEach, vi } from 'vitest';

const { stubs } = vi.hoisted(() => {
	const sinon = require('sinon');
	return {
		stubs: {
			Users: {
				findOneById: sinon.stub(),
				setUsername: sinon.stub(),
			},
			Subscriptions: {
				findUserFederatedRoomIds: sinon.stub(),
			},
			Accounts: {
				sendEnrollmentEmail: sinon.stub(),
			},
			settings: {
				get: sinon.stub(),
			},
			api: {
				broadcast: sinon.stub(),
			},
			Invites: {
				findOneById: sinon.stub(),
			},
			callbacks: {
				run: sinon.stub(),
			},
			checkUsernameAvailability: sinon.stub(),
			validateUsername: sinon.stub(),
			saveUserIdentity: sinon.stub(),
			joinDefaultChannels: sinon.stub(),
			getAvatarSuggestionForUser: sinon.stub(),
			setUserAvatar: sinon.stub(),
			addUserToRoom: sinon.stub(),
			notifyOnUserChange: sinon.stub(),
			underscore: {
				escape: sinon.stub(),
			},
			SystemLogger: sinon.stub(),
		},
	};
});

vi.mock('../../../../../../server/database/utils', () => ({ onceTransactionCommitedSuccessfully: async (cb: any, _sess: any) => cb() }));
vi.mock('meteor/meteor', () => ({ Meteor: { Error } }));
vi.mock('@rocket.chat/core-services', () => ({ api: stubs.api }));
vi.mock('@rocket.chat/models', () => ({ Users: stubs.Users, Invites: stubs.Invites, Subscriptions: stubs.Subscriptions }));
vi.mock('meteor/accounts-base', () => ({ Accounts: stubs.Accounts }));
vi.mock('underscore', () => ({ default: stubs.underscore, ...stubs.underscore }));
vi.mock('../../../../../../app/settings/server', () => ({ settings: stubs.settings }));
vi.mock('../../../../../../app/lib/server/lib', () => ({ notifyOnUserChange: stubs.notifyOnUserChange }));
vi.mock('../../../../../../app/lib/server/functions/addUserToRoom', () => ({ addUserToRoom: stubs.addUserToRoom }));
vi.mock('../../../../../../app/lib/server/functions/checkUsernameAvailability', () => ({
	checkUsernameAvailability: stubs.checkUsernameAvailability,
}));
vi.mock('../../../../../../app/lib/server/functions/getAvatarSuggestionForUser', () => ({
	getAvatarSuggestionForUser: stubs.getAvatarSuggestionForUser,
}));
vi.mock('../../../../../../app/lib/server/functions/joinDefaultChannels', () => ({ joinDefaultChannels: stubs.joinDefaultChannels }));
vi.mock('../../../../../../app/lib/server/functions/saveUserIdentity', () => ({ saveUserIdentity: stubs.saveUserIdentity }));
vi.mock('../../../../../../app/lib/server/functions/setUserAvatar', () => ({ setUserAvatar: stubs.setUserAvatar }));
vi.mock('../../../../../../app/lib/server/functions/validateUsername', () => ({ validateUsername: stubs.validateUsername }));
vi.mock('../../../../../../server/lib/callbacks', () => ({ callbacks: stubs.callbacks }));
vi.mock('../../../../../../server/lib/logger/system', () => ({ SystemLogger: stubs.SystemLogger }));

const { setUsernameWithValidation, _setUsername } = await import('../../../../../../app/lib/server/functions/setUsername');

describe('setUsername', () => {
	const userId = 'userId';
	const username = 'validUsername';

	beforeEach(() => {
		stubs.Subscriptions.findUserFederatedRoomIds.returns({
			hasNext: sinon.stub().resolves(false),
			close: sinon.stub().resolves(),
		});
	});

	afterEach(() => {
		stubs.Users.findOneById.reset();
		stubs.Users.setUsername.reset();
		stubs.Subscriptions.findUserFederatedRoomIds.reset();
		stubs.Accounts.sendEnrollmentEmail.reset();
		stubs.settings.get.reset();
		stubs.api.broadcast.reset();
		stubs.Invites.findOneById.reset();
		stubs.callbacks.run.reset();
		stubs.checkUsernameAvailability.reset();
		stubs.validateUsername.reset();
		stubs.saveUserIdentity.reset();
		stubs.joinDefaultChannels.reset();
		stubs.getAvatarSuggestionForUser.reset();
		stubs.setUserAvatar.reset();
		stubs.addUserToRoom.reset();
		stubs.notifyOnUserChange.reset();
		stubs.underscore.escape.reset();
		stubs.SystemLogger.reset();
	});

	describe('setUsernameWithValidation', () => {
		it('should throw an error if username is invalid', async () => {
			try {
				await setUsernameWithValidation(userId, '');
			} catch (error: any) {
				expect(error.message).to.equal('error-invalid-username');
			}
		});

		it('should throw an error if user is not found', async () => {
			stubs.Users.findOneById.withArgs(userId).returns(null);

			try {
				await setUsernameWithValidation(userId, username);
			} catch (error: any) {
				expect(stubs.Users.findOneById.calledOnce).to.be.true;
				expect(error.message).to.equal('error-invalid-user');
			}
		});

		it('should throw an error if username change is not allowed', async () => {
			stubs.Users.findOneById.resolves({ username: 'oldUsername' });
			stubs.settings.get.withArgs('Accounts_AllowUsernameChange').returns(false);

			try {
				await setUsernameWithValidation(userId, username);
			} catch (error: any) {
				expect(stubs.settings.get.calledOnce).to.be.true;
				expect(error.message).to.equal('error-not-allowed');
			}
		});

		it('should throw an error if username is not valid', async () => {
			stubs.Users.findOneById.resolves({ username: null });
			stubs.validateUsername.returns(false);

			try {
				await setUsernameWithValidation(userId, 'invalid-username');
			} catch (error: any) {
				expect(stubs.validateUsername.calledOnce).to.be.true;
				expect(error.message).to.equal('username-invalid');
			}
		});

		it('should throw an error if username is already in use', async () => {
			stubs.Users.findOneById.resolves({ username: null });
			stubs.validateUsername.returns(true);
			stubs.checkUsernameAvailability.resolves(false);

			try {
				await setUsernameWithValidation(userId, 'existingUsername');
			} catch (error: any) {
				expect(stubs.checkUsernameAvailability.calledOnce).to.be.true;
				expect(error.message).to.equal('error-field-unavailable');
			}
		});

		it('should throw an error if local user is in federated rooms', async () => {
			stubs.Users.findOneById.resolves({ _id: userId, username: null });
			stubs.validateUsername.returns(true);
			stubs.checkUsernameAvailability.resolves(true);
			stubs.Subscriptions.findUserFederatedRoomIds.returns({
				hasNext: sinon.stub().resolves(true),
				close: sinon.stub().resolves(),
			});

			try {
				await setUsernameWithValidation(userId, 'newUsername');
			} catch (error: any) {
				expect(stubs.Subscriptions.findUserFederatedRoomIds.calledOnce).to.be.true;
				expect(error.message).to.equal('error-not-allowed');
			}
		});

		it('should throw an error if user is federated', async () => {
			stubs.Users.findOneById.resolves({
				_id: userId,
				username: null,
				federated: true,
				federation: { version: 1, mui: '@user:origin', origin: 'origin' },
			});
			stubs.validateUsername.returns(true);
			stubs.checkUsernameAvailability.resolves(true);

			try {
				await setUsernameWithValidation(userId, 'newUsername');
			} catch (error: any) {
				expect(stubs.Subscriptions.findUserFederatedRoomIds.notCalled).to.be.true;
				expect(error.message).to.equal('error-not-allowed');
			}
		});

		it('should save the user identity when valid username is set', async () => {
			stubs.Users.findOneById.resolves({ _id: userId, username: null });
			stubs.settings.get.withArgs('Accounts_AllowUsernameChange').returns(true);
			stubs.validateUsername.returns(true);
			stubs.checkUsernameAvailability.resolves(true);
			stubs.saveUserIdentity.resolves(true);

			await setUsernameWithValidation(userId, 'newUsername');

			expect(stubs.saveUserIdentity.calledOnce).to.be.true;
			expect(stubs.joinDefaultChannels.calledOnceWith(userId, undefined)).to.be.true;
		});
	});

	describe('_setUsername', () => {
		it('should return false if userId or username is missing', async () => {
			const result = await _setUsername(null as unknown as string, '', {} as unknown as IUser);
			expect(result).to.be.false;
		});

		it('should return false if username is invalid', async () => {
			stubs.validateUsername.returns(false);

			const result = await _setUsername(userId, 'invalid-username', {} as unknown as IUser);
			expect(result).to.be.false;
		});

		it('should return user if username is already set', async () => {
			stubs.validateUsername.returns(true);
			const mockUser = { username } as unknown as IUser;

			const result = await _setUsername(userId, username, mockUser);
			expect(result).to.equal(mockUser);
		});

		it('should set username when user has no previous username', async () => {
			const mockUser = { _id: userId, emails: [{ address: 'test@example.com' }] } as unknown as IUser;
			stubs.validateUsername.returns(true);
			stubs.Users.findOneById.resolves(mockUser);
			stubs.checkUsernameAvailability.resolves(true);

			await _setUsername(userId, username, mockUser);

			expect(stubs.Users.setUsername.calledOnceWith(userId, username));
			expect(stubs.checkUsernameAvailability.calledOnceWith(username));
			expect(stubs.api.broadcast.calledOnceWith('user.autoupdate', { user: mockUser }));
		});

		it('should set username when user has and old that is different from new', async () => {
			const mockUser = { _id: userId, username: 'oldUsername', emails: [{ address: 'test@example.com' }] } as unknown as IUser;
			stubs.validateUsername.returns(true);
			stubs.Users.findOneById.resolves(mockUser);
			stubs.checkUsernameAvailability.resolves(true);

			await _setUsername(userId, username, mockUser);

			expect(stubs.Users.setUsername.calledOnceWith(userId, username));
			expect(stubs.checkUsernameAvailability.calledOnceWith(username));
			expect(stubs.api.broadcast.calledOnceWith('user.autoupdate', { user: mockUser }));
		});

		it('should set username when user has and old that is different from new', async () => {
			const mockUser = { _id: userId, username: 'oldUsername', emails: [{ address: 'test@example.com' }] } as unknown as IUser;
			stubs.validateUsername.returns(true);
			stubs.Users.findOneById.resolves(mockUser);
			stubs.checkUsernameAvailability.resolves(true);

			await _setUsername(userId, username, mockUser);

			expect(stubs.Users.setUsername.calledOnceWith(userId, username));
			expect(stubs.checkUsernameAvailability.calledOnceWith(username));
			expect(stubs.api.broadcast.calledOnceWith('user.autoupdate', { user: mockUser }));
		});

		it('should set avatar if Accounts_SetDefaultAvatar is enabled', async () => {
			const mockUser = { _id: userId, username: null } as unknown as IUser;
			stubs.validateUsername.returns(true);
			stubs.Users.findOneById.resolves(mockUser);
			stubs.checkUsernameAvailability.resolves(true);
			stubs.settings.get.withArgs('Accounts_SetDefaultAvatar').returns(true);
			stubs.getAvatarSuggestionForUser.resolves({ gravatar: { blob: 'blobData', contentType: 'image/png' } });

			await _setUsername(userId, username, mockUser);

			expect(stubs.setUserAvatar.calledOnceWith(mockUser, 'blobData', 'image/png', 'gravatar')).to.be.true;
		});

		it('should not set avatar if Accounts_SetDefaultAvatar is disabled', async () => {
			const mockUser = { _id: userId, username: null } as unknown as IUser;
			stubs.validateUsername.returns(true);
			stubs.Users.findOneById.resolves(mockUser);
			stubs.checkUsernameAvailability.resolves(true);
			stubs.settings.get.withArgs('Accounts_SetDefaultAvatar').returns(false);

			await _setUsername(userId, username, mockUser);

			expect(stubs.setUserAvatar.called).to.be.false;
		});

		it('should not set avatar if no avatar suggestions are available', async () => {
			const mockUser = { _id: userId, username: null } as unknown as IUser;
			stubs.validateUsername.returns(true);
			stubs.Users.findOneById.resolves(mockUser);
			stubs.checkUsernameAvailability.resolves(true);
			stubs.settings.get.withArgs('Accounts_SetDefaultAvatar').returns(true);
			stubs.getAvatarSuggestionForUser.resolves({});

			await _setUsername(userId, username, mockUser);

			expect(stubs.setUserAvatar.called).to.be.false;
		});

		it('should add user to room if inviteToken is present', async () => {
			const mockUser = { _id: userId, username: null, inviteToken: 'invite token' } as unknown as IUser;
			stubs.validateUsername.returns(true);
			stubs.Users.findOneById.resolves(mockUser);
			stubs.checkUsernameAvailability.resolves(true);
			stubs.settings.get.withArgs('Accounts_SetDefaultAvatar').returns(true);
			stubs.getAvatarSuggestionForUser.resolves({ gravatar: { blob: 'blobData', contentType: 'image/png' } });
			stubs.Invites.findOneById.resolves({ rid: 'room id' });

			await _setUsername(userId, username, mockUser);

			expect(stubs.addUserToRoom.calledOnceWith('room id', mockUser)).to.be.true;
		});
	});
});
