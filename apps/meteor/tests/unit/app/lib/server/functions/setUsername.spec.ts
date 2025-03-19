import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('setUsername', () => {
	const userId = 'userId';
	const username = 'validUsername';

	const stubs = {
		Users: {
			findOneById: sinon.stub(),
			setUsername: sinon.stub(),
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
		RateLimiter: {
			limitFunction: sinon.stub(),
		},
		underscore: {
			escape: sinon.stub(),
		},
		SystemLogger: sinon.stub(),
	};

	const { setUsernameWithValidation, _setUsername } = proxyquire
		.noCallThru()
		.load('../../../../../../app/lib/server/functions/setUsername', {
			'../../../../server/database/utils': { onceTransactionCommitedSuccessfully: async (cb: any, _sess: any) => cb() },
			'meteor/meteor': { Meteor: { Error } },
			'@rocket.chat/core-services': { api: stubs.api },
			'@rocket.chat/models': { Users: stubs.Users, Invites: stubs.Invites },
			'meteor/accounts-base': { Accounts: stubs.Accounts },
			'underscore': stubs.underscore,
			'../../../settings/server': { settings: stubs.settings },
			'../lib': { notifyOnUserChange: stubs.notifyOnUserChange, RateLimiter: stubs.RateLimiter },
			'./addUserToRoom': { addUserToRoom: stubs.addUserToRoom },
			'./checkUsernameAvailability': { checkUsernameAvailability: stubs.checkUsernameAvailability },
			'./getAvatarSuggestionForUser': { getAvatarSuggestionForUser: stubs.getAvatarSuggestionForUser },
			'./joinDefaultChannels': { joinDefaultChannels: stubs.joinDefaultChannels },
			'./saveUserIdentity': { saveUserIdentity: stubs.saveUserIdentity },
			'./setUserAvatar': { setUserAvatar: stubs.setUserAvatar },
			'./validateUsername': { validateUsername: stubs.validateUsername },
			'../../../../lib/callbacks': { callbacks: stubs.callbacks },
			'../../../../server/lib/logger/system': { SystemLogger: stubs.SystemLogger },
		});

	afterEach(() => {
		stubs.Users.findOneById.reset();
		stubs.Users.setUsername.reset();
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
		stubs.RateLimiter.limitFunction.reset();
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
			const result = await _setUsername(null, '', {});
			expect(result).to.be.false;
		});

		it('should return false if username is invalid', async () => {
			stubs.validateUsername.returns(false);

			const result = await _setUsername(userId, 'invalid-username', {});
			expect(result).to.be.false;
		});

		it('should return user if username is already set', async () => {
			stubs.validateUsername.returns(true);
			const mockUser = { username };

			const result = await _setUsername(userId, username, mockUser);
			expect(result).to.equal(mockUser);
		});

		it('should set username when user has no previous username', async () => {
			const mockUser = { _id: userId, emails: [{ address: 'test@example.com' }] };
			stubs.validateUsername.returns(true);
			stubs.Users.findOneById.resolves(mockUser);
			stubs.checkUsernameAvailability.resolves(true);

			await _setUsername(userId, username, mockUser);

			expect(stubs.Users.setUsername.calledOnceWith(userId, username));
			expect(stubs.checkUsernameAvailability.calledOnceWith(username));
			expect(stubs.api.broadcast.calledOnceWith('user.autoupdate', { user: mockUser }));
		});

		it('should set username when user has and old that is different from new', async () => {
			const mockUser = { _id: userId, username: 'oldUsername', emails: [{ address: 'test@example.com' }] };
			stubs.validateUsername.returns(true);
			stubs.Users.findOneById.resolves(mockUser);
			stubs.checkUsernameAvailability.resolves(true);

			await _setUsername(userId, username, mockUser);

			expect(stubs.Users.setUsername.calledOnceWith(userId, username));
			expect(stubs.checkUsernameAvailability.calledOnceWith(username));
			expect(stubs.api.broadcast.calledOnceWith('user.autoupdate', { user: mockUser }));
		});

		it('should set username when user has and old that is different from new', async () => {
			const mockUser = { _id: userId, username: 'oldUsername', emails: [{ address: 'test@example.com' }] };
			stubs.validateUsername.returns(true);
			stubs.Users.findOneById.resolves(mockUser);
			stubs.checkUsernameAvailability.resolves(true);

			await _setUsername(userId, username, mockUser);

			expect(stubs.Users.setUsername.calledOnceWith(userId, username));
			expect(stubs.checkUsernameAvailability.calledOnceWith(username));
			expect(stubs.api.broadcast.calledOnceWith('user.autoupdate', { user: mockUser }));
		});

		it('should set avatar if Accounts_SetDefaultAvatar is enabled', async () => {
			const mockUser = { _id: userId, username: null };
			stubs.validateUsername.returns(true);
			stubs.Users.findOneById.resolves(mockUser);
			stubs.checkUsernameAvailability.resolves(true);
			stubs.settings.get.withArgs('Accounts_SetDefaultAvatar').returns(true);
			stubs.getAvatarSuggestionForUser.resolves({ gravatar: { blob: 'blobData', contentType: 'image/png' } });

			await _setUsername(userId, username, mockUser);

			expect(stubs.setUserAvatar.calledOnceWith(mockUser, 'blobData', 'image/png', 'gravatar')).to.be.true;
		});

		it('should not set avatar if Accounts_SetDefaultAvatar is disabled', async () => {
			const mockUser = { _id: userId, username: null };
			stubs.validateUsername.returns(true);
			stubs.Users.findOneById.resolves(mockUser);
			stubs.checkUsernameAvailability.resolves(true);
			stubs.settings.get.withArgs('Accounts_SetDefaultAvatar').returns(false);

			await _setUsername(userId, username, mockUser);

			expect(stubs.setUserAvatar.called).to.be.false;
		});

		it('should not set avatar if no avatar suggestions are available', async () => {
			const mockUser = { _id: userId, username: null };
			stubs.validateUsername.returns(true);
			stubs.Users.findOneById.resolves(mockUser);
			stubs.checkUsernameAvailability.resolves(true);
			stubs.settings.get.withArgs('Accounts_SetDefaultAvatar').returns(true);
			stubs.getAvatarSuggestionForUser.resolves({});

			await _setUsername(userId, username, mockUser);

			expect(stubs.setUserAvatar.called).to.be.false;
		});

		it('should add user to room if inviteToken is present', async () => {
			const mockUser = { _id: userId, username: null, inviteToken: 'invite token' };
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
