import { beforeEach, describe, it, mock } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const settingsGet = sinon.stub();
const hashPassword = sinon.stub();
const triggerEvent = sinon.stub();
const setEmailFunction = sinon.stub();
const setUserStatusMethod = sinon.stub();
const getUserInfo = sinon.stub();
const twoFactorCall = sinon.stub();
const passwordPolicyValidate = sinon.stub();
const callbacksRun = sinon.stub();
const compareUserPassword = sinon.stub();
const compareUserPasswordHistory = sinon.stub();
const notifyOnUserChange = sinon.stub();
const saveCustomFields = sinon.stub();
const validateUserEditing = sinon.stub();
const saveUserIdentity = sinon.stub();

const moduleMocks = [
	mock.module('@rocket.chat/account-utils', { exports: { hashPassword } }),
	mock.module('@rocket.chat/apps', {
		exports: { Apps: { self: { triggerEvent } }, AppEvents: { IPostUserUpdated: 'IPostUserUpdated' } },
	}),
	mock.module('@rocket.chat/core-services', { exports: { ClientSafeError } }),
	mock.module('./setEmail', { exports: { setEmailFunction } }),
	mock.module('./setUserStatus', { exports: { setUserStatusMethod } }),
	mock.module('../../api/lib/getUserInfo', { exports: { getUserInfo } }),
	mock.module('../../lib/2fa/twoFactorRequired', {
		exports: {
			twoFactorRequired: (fn: (...args: unknown[]) => Promise<unknown>, options: unknown) =>
				async function (this: unknown, ...args: unknown[]) {
					twoFactorCall(options, ...args);
					return fn.apply(this, args);
				},
		},
	}),
	mock.module('../../lib/auth/passwordPolicy', { exports: { passwordPolicy: { validate: passwordPolicyValidate } } }),
	mock.module('../../lib/callbacks', { exports: { callbacks: { run: callbacksRun } } }),
	mock.module('../../lib/compareUserPassword', { exports: { compareUserPassword } }),
	mock.module('../../lib/compareUserPasswordHistory', { exports: { compareUserPasswordHistory } }),
	mock.module('../../lib/notifyListener', { exports: { notifyOnUserChange } }),
	mock.module('../../lib/users/saveCustomFields', { exports: { saveCustomFields } }),
	mock.module('../../lib/users/saveUser', { exports: { validateUserEditing } }),
	mock.module('../../lib/users/saveUserIdentity', { exports: { saveUserIdentity } }),
	mock.module('../../settings', { exports: { settings: { get: settingsGet } } }),
];
// oxlint-disable-next-line @typescript-eslint/no-require-imports
const { executeSaveUserProfile } = require('./saveUserProfile');

moduleMocks.forEach((moduleMock) => moduleMock.restore());

describe('executeSaveUserProfile', () => {
	let Users: Record<string, sinon.SinonStub>;

	const context = { userId: 'uid', token: 'login-token' };
	const user = { _id: 'uid', username: 'jane', services: { password: { bcrypt: 'old-hash' } } };
	const updatedUser = { _id: 'uid', username: 'jane', bio: 'updated' };

	beforeEach(() => {
		Users = {
			findOneById: sinon.stub(),
			setBio: sinon.stub(),
			setNickname: sinon.stub(),
			setPhones: sinon.stub(),
			setPasswordHash: sinon.stub(),
			unsetRequirePasswordChange: sinon.stub(),
			addPasswordToHistory: sinon.stub(),
			removeNonLoginTokensExcept: sinon.stub(),
			unsetLoginTokens: sinon.stub(),
			setProfile: sinon.stub(),
		};
		Users.findOneById.onFirstCall().resolves(user).onSecondCall().resolves(updatedUser);
		mockModel('Users', Users);
		[
			settingsGet,
			hashPassword,
			triggerEvent,
			setEmailFunction,
			setUserStatusMethod,
			getUserInfo,
			twoFactorCall,
			passwordPolicyValidate,
			callbacksRun,
			compareUserPassword,
			compareUserPasswordHistory,
			notifyOnUserChange,
			saveCustomFields,
			validateUserEditing,
			saveUserIdentity,
		].forEach((stub) => stub.reset());
		settingsGet.withArgs('Accounts_AllowUserProfileChange').returns(true);
		settingsGet.withArgs('Accounts_AllowPasswordChange').returns(true);
		settingsGet.withArgs('Accounts_Password_History_Amount').returns(5);
		saveUserIdentity.resolves(true);
		compareUserPassword.resolves(false);
		compareUserPasswordHistory.resolves(true);
		hashPassword.callsFake(async (password: string) => `hashed:${password}`);
		getUserInfo.callsFake(async (u: { _id: string }) => ({ info: u._id }));
	});

	describe('two factor', () => {
		it('requires a second factor when changing the email of a user that has one', async () => {
			await executeSaveUserProfile.call(context, { emails: [{ address: 'a@b.c' }] }, { email: 'new@b.c' }, {}, { twoFactorCode: '1' });

			expect(twoFactorCall.calledOnceWith({ requireSecondFactor: true }, { email: 'new@b.c' }, {}, { twoFactorCode: '1' })).to.be.true;
		});

		it('requires a second factor when changing the password of a user with services', async () => {
			compareUserPassword.resolves(true);

			await expect(executeSaveUserProfile.call(context, user, { newPassword: 'new' })).to.be.rejectedWith(
				'[error-password-same-as-current]',
			);
			expect(twoFactorCall.calledOnceWith({ requireSecondFactor: true }, { newPassword: 'new' }, {})).to.be.true;
		});

		for (const [description, target, settings] of [
			['a user forced to change the password', { ...user, requirePasswordChange: true }, { newPassword: 'new' }],
			['a user without services', { _id: 'uid' }, { newPassword: 'new' }],
			['a user without emails changing the email', { _id: 'uid' }, { email: 'new@b.c' }],
			['a change without email or password', user, { bio: 'hi' }],
		] as const) {
			it(`does not require a second factor for ${description}`, async () => {
				await executeSaveUserProfile.call(context, target, settings);

				expect(twoFactorCall.called).to.be.false;
			});
		}
	});

	it('refuses when Accounts_AllowUserProfileChange is off', async () => {
		settingsGet.withArgs('Accounts_AllowUserProfileChange').returns(false);

		await expect(executeSaveUserProfile.call(context, user, {})).to.be.rejectedWith('Not allowed [error-not-allowed]');
		expect(validateUserEditing.called).to.be.false;
	});

	it('refuses an unauthenticated call', async () => {
		await expect(executeSaveUserProfile.call({}, user, {})).to.be.rejectedWith('Unauthenticated [error-unauthenticated]');
	});

	it('validates the edit with the profile fields mapped to user data, ignoring an empty username', async () => {
		await executeSaveUserProfile.call(context, user, {
			email: 'e@x.y',
			username: '',
			realname: 'Jane',
			newPassword: 'pw',
			statusText: 'hi',
		});

		expect(
			validateUserEditing.calledOnceWith('uid', {
				_id: 'uid',
				email: 'e@x.y',
				username: undefined,
				name: 'Jane',
				password: 'pw',
				statusText: 'hi',
			}),
		).to.be.true;
		sinon.assert.callOrder(validateUserEditing, Users.findOneById);
	});

	it('refuses when the user does not exist', async () => {
		Users.findOneById.onFirstCall().resolves(null);

		await expect(executeSaveUserProfile.call(context, user, {})).to.be.rejectedWith('Invalid user [error-invalid-user]');
		expect(Users.setProfile.called).to.be.false;
	});

	describe('identity', () => {
		it('saves the name and username', async () => {
			await executeSaveUserProfile.call(context, user, { realname: 'Jane', username: 'jane2' });

			expect(saveUserIdentity.calledOnceWith({ _id: 'uid', name: 'Jane', username: 'jane2' })).to.be.true;
		});

		it('saves an empty name to remove it', async () => {
			await executeSaveUserProfile.call(context, user, { realname: '' });

			expect(saveUserIdentity.calledOnceWith({ _id: 'uid', name: '', username: undefined })).to.be.true;
		});

		it('does not save the identity when neither name nor a non-empty username is given', async () => {
			await executeSaveUserProfile.call(context, user, { username: '' });

			expect(saveUserIdentity.called).to.be.false;
		});

		it('throws when the identity cannot be saved', async () => {
			saveUserIdentity.resolves(false);

			await expect(executeSaveUserProfile.call(context, user, { username: 'jane2' })).to.be.rejectedWith(
				'Could not save user identity [error-could-not-save-identity]',
			);
			expect(Users.setProfile.called).to.be.false;
		});
	});

	describe('status', () => {
		it('sets the status type and text', async () => {
			await executeSaveUserProfile.call(context, user, { statusType: 'away', statusText: 'lunch' });

			expect(setUserStatusMethod.calledOnceWith(user, 'away', 'lunch')).to.be.true;
		});

		it('sets an empty status text without a type', async () => {
			await executeSaveUserProfile.call(context, user, { statusText: '' });

			expect(setUserStatusMethod.calledOnceWith(user, undefined, '')).to.be.true;
		});

		it('leaves the status alone when neither type nor text is given', async () => {
			await executeSaveUserProfile.call(context, user, {});

			expect(setUserStatusMethod.called).to.be.false;
		});
	});

	describe('bio', () => {
		it('saves the trimmed bio', async () => {
			await executeSaveUserProfile.call(context, user, { bio: '  hello  ' });

			expect(Users.setBio.calledOnceWith('uid', 'hello')).to.be.true;
		});

		it('saves an empty bio', async () => {
			await executeSaveUserProfile.call(context, user, { bio: '' });

			expect(Users.setBio.calledOnceWith('uid', '')).to.be.true;
		});

		it('accepts a bio of exactly 260 characters', async () => {
			await executeSaveUserProfile.call(context, user, { bio: 'a'.repeat(260) });

			expect(Users.setBio.calledOnceWith('uid', 'a'.repeat(260))).to.be.true;
		});

		it('refuses a bio longer than 260 characters', async () => {
			await expect(executeSaveUserProfile.call(context, user, { bio: 'a'.repeat(261) })).to.be.rejectedWith(
				'Bio size exceeds 260 characters [error-bio-size-exceeded]',
			);
			expect(Users.setBio.called).to.be.false;
		});

		it('refuses a bio that is not a string', async () => {
			await expect(executeSaveUserProfile.call(context, user, { bio: 42 })).to.be.rejectedWith('bio [error-invalid-field]');
		});

		it('leaves the bio alone when it is not given', async () => {
			await executeSaveUserProfile.call(context, user, {});

			expect(Users.setBio.called).to.be.false;
		});
	});

	describe('nickname', () => {
		it('saves the trimmed nickname', async () => {
			await executeSaveUserProfile.call(context, user, { nickname: '  jj  ' });

			expect(Users.setNickname.calledOnceWith('uid', 'jj')).to.be.true;
		});

		it('saves an empty nickname', async () => {
			await executeSaveUserProfile.call(context, user, { nickname: '' });

			expect(Users.setNickname.calledOnceWith('uid', '')).to.be.true;
		});

		it('refuses a nickname longer than 120 characters', async () => {
			await expect(executeSaveUserProfile.call(context, user, { nickname: 'a'.repeat(121) })).to.be.rejectedWith(
				'Nickname size exceeds 120 characters [error-nickname-size-exceeded]',
			);
			expect(Users.setNickname.called).to.be.false;
		});

		it('refuses a nickname that is not a string', async () => {
			await expect(executeSaveUserProfile.call(context, user, { nickname: true })).to.be.rejectedWith('nickname [error-invalid-field]');
		});

		it('validates the bio before the nickname', async () => {
			await expect(executeSaveUserProfile.call(context, user, { bio: 'a'.repeat(261), nickname: 'jj' })).to.be.rejectedWith(
				'[error-bio-size-exceeded]',
			);
			expect(Users.setNickname.called).to.be.false;
		});
	});

	it('saves the phones', async () => {
		await executeSaveUserProfile.call(context, user, { phones: [{ phoneNumber: '+1' }] });

		expect(Users.setPhones.calledOnceWith('uid', [{ phoneNumber: '+1' }])).to.be.true;
		expect(notifyOnUserChange.calledOnceWith({ clientAction: 'updated', id: 'uid', diff: { info: 'uid' } })).to.be.true;
	});

	it('clears the phones and notifies them as unset', async () => {
		await executeSaveUserProfile.call(context, user, { phones: [] });

		expect(Users.setPhones.calledOnceWith('uid', [])).to.be.true;
		expect(notifyOnUserChange.calledOnceWith({ clientAction: 'updated', id: 'uid', diff: { info: 'uid' }, unset: { phones: true } })).to.be
			.true;
	});

	it('saves the email', async () => {
		await executeSaveUserProfile.call(context, { _id: 'uid' }, { email: 'new@b.c' });

		expect(setEmailFunction.calledOnceWith('new@b.c', user)).to.be.true;
	});

	describe('password', () => {
		it('changes the password, records the previous one and keeps only the current login token', async () => {
			await executeSaveUserProfile.call(context, user, { newPassword: 'new' });

			expect(compareUserPassword.calledOnceWith(user, { plain: 'new' })).to.be.true;
			expect(compareUserPasswordHistory.called).to.be.false;
			expect(passwordPolicyValidate.calledOnceWith('new')).to.be.true;
			expect(Users.setPasswordHash.calledOnceWith('uid', 'hashed:new')).to.be.true;
			expect(Users.unsetRequirePasswordChange.called).to.be.false;
			expect(Users.addPasswordToHistory.calledOnceWith('uid', 'old-hash', 5)).to.be.true;
			expect(Users.removeNonLoginTokensExcept.calledOnceWith('uid', 'login-token')).to.be.true;
			expect(Users.unsetLoginTokens.called).to.be.false;
			sinon.assert.callOrder(
				compareUserPassword,
				passwordPolicyValidate,
				Users.setPasswordHash,
				Users.addPasswordToHistory,
				Users.removeNonLoginTokensExcept,
				Users.setProfile,
			);
		});

		it('clears the forced password change and notifies it as unset', async () => {
			Users.findOneById.onFirstCall().resolves({ ...user, requirePasswordChange: true });

			await executeSaveUserProfile.call(context, user, { newPassword: 'new' });

			expect(Users.unsetRequirePasswordChange.calledOnceWith('uid')).to.be.true;
			expect(
				notifyOnUserChange.calledOnceWith({
					clientAction: 'updated',
					id: 'uid',
					diff: { info: 'uid' },
					unset: { requirePasswordChange: true, requirePasswordChangeReason: true },
				}),
			).to.be.true;
		});

		it('removes all login tokens when keeping only the current one fails', async () => {
			Users.removeNonLoginTokensExcept.rejects(new Error('boom'));

			await executeSaveUserProfile.call(context, user, { newPassword: 'new' });

			expect(Users.unsetLoginTokens.calledOnceWith('uid')).to.be.true;
		});

		it('refuses the current password', async () => {
			compareUserPassword.resolves(true);

			await expect(executeSaveUserProfile.call(context, user, { newPassword: 'old' })).to.be.rejectedWith(
				'Entered password same as current password [error-password-same-as-current]',
			);
			expect(Users.setPasswordHash.called).to.be.false;
		});

		it('refuses a password from the history', async () => {
			Users.findOneById.onFirstCall().resolves({ ...user, services: { ...user.services, passwordHistory: ['h1'] } });
			compareUserPasswordHistory.resolves(false);

			await expect(executeSaveUserProfile.call(context, user, { newPassword: 'reused' })).to.be.rejectedWith(
				'Entered password has been previously used [error-password-in-history]',
			);
			expect(compareUserPasswordHistory.calledOnce).to.be.true;
			expect(compareUserPasswordHistory.firstCall.args[1]).to.deep.equal({ plain: 'reused' });
			expect(Users.setPasswordHash.called).to.be.false;
		});

		it('propagates a password policy failure without saving', async () => {
			passwordPolicyValidate.throws(new Error('policy'));

			await expect(executeSaveUserProfile.call(context, user, { newPassword: 'weak' })).to.be.rejectedWith('policy');
			expect(Users.setPasswordHash.called).to.be.false;
		});

		it('ignores the new password when Accounts_AllowPasswordChange is off', async () => {
			settingsGet.withArgs('Accounts_AllowPasswordChange').returns(false);

			await executeSaveUserProfile.call(context, user, { newPassword: 'new' });

			expect(Users.setPasswordHash.called).to.be.false;
			expect(Users.setProfile.calledOnce).to.be.true;
		});

		it('ignores the new password for a user without a password hash, even when OAuth users may change it', async () => {
			settingsGet.withArgs('Accounts_AllowPasswordChangeForOAuthUsers').returns(true);
			Users.findOneById.onFirstCall().resolves({ _id: 'uid', services: { google: {} } });

			await executeSaveUserProfile.call(context, user, { newPassword: 'new' });

			expect(compareUserPassword.called).to.be.false;
			expect(Users.setPasswordHash.called).to.be.false;
		});
	});

	it('saves the given custom fields', async () => {
		await executeSaveUserProfile.call(context, user, {}, { team: 'a' });

		expect(saveCustomFields.calledOnceWith('uid', { team: 'a' })).to.be.true;
	});

	it('does not save empty custom fields', async () => {
		await executeSaveUserProfile.call(context, user, {}, {});

		expect(saveCustomFields.called).to.be.false;
	});

	it('throws when the user disappears after saving', async () => {
		Users.findOneById.onSecondCall().resolves(null);

		await expect(executeSaveUserProfile.call(context, user, {})).to.be.rejectedWith(
			'Unexpected error after saving user profile: user not found',
		);
		expect(callbacksRun.called).to.be.false;
	});

	it('touches the profile, then runs afterSaveUser, notifies the change and triggers IPostUserUpdated', async () => {
		expect(await executeSaveUserProfile.call(context, user, {})).to.be.true;

		expect(Users.setProfile.calledOnceWith('uid', {})).to.be.true;
		expect(Users.findOneById.secondCall.args).to.deep.equal(['uid']);
		expect(callbacksRun.calledOnceWith('afterSaveUser', { user: updatedUser, oldUser: user })).to.be.true;
		expect(getUserInfo.calledOnceWith(updatedUser)).to.be.true;
		expect(notifyOnUserChange.calledOnceWith({ clientAction: 'updated', id: 'uid', diff: { info: 'uid' } })).to.be.true;
		expect(triggerEvent.calledOnceWith('IPostUserUpdated', { user: updatedUser, previousUser: user })).to.be.true;
		sinon.assert.callOrder(Users.setProfile, callbacksRun, notifyOnUserChange, triggerEvent);
	});

	it('applies the profile changes in order: identity, status, bio, nickname, phones, email, password, profile, custom fields', async () => {
		await executeSaveUserProfile.call(
			context,
			{ _id: 'uid' },
			{ realname: 'J', statusText: 's', bio: 'b', nickname: 'n', phones: [], email: 'e@x.y', newPassword: 'new' },
			{ team: 'a' },
		);

		sinon.assert.callOrder(
			saveUserIdentity,
			setUserStatusMethod,
			Users.setBio,
			Users.setNickname,
			Users.setPhones,
			setEmailFunction,
			Users.setPasswordHash,
			Users.setProfile,
			saveCustomFields,
			callbacksRun,
		);
	});
});
