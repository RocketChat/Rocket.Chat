import { afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
import { UpdaterImpl } from '@rocket.chat/models';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import { set, unset } from 'lodash';
import sinon from 'sinon';

const session = { id: 'session' };
const triggerEvent = sinon.stub();
const setStatus = sinon.stub();
const isPresenceDisabledFor = sinon.stub();
const invalidate = sinon.stub();
const refresh = sinon.stub();
const saveNewUser = sinon.stub();
const sendPasswordEmail = sinon.stub();
const setPasswordUpdater = sinon.stub();
const validateUserData = sinon.stub();
const validateUserEditing = sinon.stub();
const onceCommitted = sinon.stub();
const generatePassword = sinon.stub();
const passwordPolicyValidate = sinon.stub();
const hasPermissionAsync = sinon.stub();
const callbacksRun = sinon.stub();
const notifyOnUserChange = sinon.stub();
const shouldBreakInVersion = sinon.stub();
const resolveUsersByUsernames = sinon.stub();
const saveCustomFields = sinon.stub();
const saveUserIdentity = sinon.stub();
const setEmail = sinon.stub();

const loadSaveUser = () => {
	mock.module('@rocket.chat/apps', {
		exports: { Apps: { self: { triggerEvent } }, AppEvents: { IPostUserUpdated: 'IPostUserUpdated' } },
	});
	mock.module('@rocket.chat/core-services', {
		exports: {
			ClientSafeError,
			Presence: { setStatus },
			StatusVisibility: { isPresenceDisabledFor, invalidate, refresh },
		},
	});
	mock.module('./saveNewUser', { exports: { saveNewUser } });
	mock.module('./sendUserEmail', { exports: { sendPasswordEmail } });
	mock.module('./setPasswordUpdater', { exports: { setPasswordUpdater } });
	mock.module('./validateUserData', { exports: { validateUserData } });
	mock.module('./validateUserEditing', { exports: { validateUserEditing } });
	mock.module('../../../database/utils', {
		exports: {
			wrapInSessionTransaction:
				(curried: (s: unknown) => (...args: unknown[]) => unknown) =>
				(...args: unknown[]) =>
					curried(session)(...args),
			onceTransactionCommitedSuccessfully: async (cb: () => Promise<void>, s: unknown) => {
				onceCommitted(s);
				await cb();
			},
		},
	});
	mock.module('../../auth/generatePassword', { exports: { generatePassword } });
	mock.module('../../auth/passwordPolicy', { exports: { passwordPolicy: { validate: passwordPolicyValidate } } });
	mock.module('../../authorization/hasPermission', { exports: { hasPermissionAsync } });
	mock.module('../../callbacks', { exports: { callbacks: { run: callbacksRun } } });
	mock.module('../../notifyListener', { exports: { notifyOnUserChange } });
	mock.module('../../shouldBreakInVersion', { exports: { shouldBreakInVersion } });
	mock.module('../../statusVisibility/resolveUsers', { exports: { resolveUsersByUsernames } });
	mock.module('../saveCustomFields', { exports: { saveCustomFields } });
	mock.module('../saveUserIdentity', { exports: { saveUserIdentity } });
	mock.module('../setEmail', { exports: { setEmail } });
	try {
		delete require.cache[require.resolve('./saveUser')];
		// oxlint-disable-next-line @typescript-eslint/no-require-imports
		return require('./saveUser');
	} finally {
		mock.restoreAll();
	}
};

let saveUser: any;
let isUpdateUserData: any;

before(() => {
	({ saveUser, isUpdateUserData } = loadSaveUser());
});

describe('saveUser', () => {
	let Users: Record<string, sinon.SinonStub>;
	let oldUser: Record<string, any>;
	let updateFilter: Record<string, any> | undefined;

	const performer = { _id: 'admin', username: 'admin' };

	beforeEach(() => {
		oldUser = {
			_id: 'uid',
			username: 'jane',
			emails: [
				{ address: 'jane@old.com', verified: false },
				{ address: 'jane@other.com', verified: false },
			],
			roles: ['user'],
		};
		updateFilter = undefined;
		Users = {
			findOneById: sinon.stub().callsFake(async (id: string) => (id === 'admin' ? performer : oldUser)),
			getUpdater: sinon.stub().callsFake(() => new UpdaterImpl()),
			updateFromUpdater: sinon.stub().callsFake(async (_query: unknown, updater: UpdaterImpl<any>) => {
				updateFilter = updater.getRawUpdateFilter();
				const user = structuredClone(oldUser);
				Object.entries(updateFilter.$set ?? {}).forEach(([path, value]) => set(user, path, value));
				Object.keys(updateFilter.$unset ?? {}).forEach((path) => unset(user, path));
				oldUser = user;
			}),
		};
		mockModel('Users', Users);
		[
			triggerEvent,
			setStatus,
			isPresenceDisabledFor,
			invalidate,
			refresh,
			saveNewUser,
			sendPasswordEmail,
			setPasswordUpdater,
			validateUserData,
			validateUserEditing,
			onceCommitted,
			generatePassword,
			passwordPolicyValidate,
			hasPermissionAsync,
			callbacksRun,
			notifyOnUserChange,
			resolveUsersByUsernames,
			saveCustomFields,
			saveUserIdentity,
			setEmail,
		].forEach((stub) => stub.reset());
		isPresenceDisabledFor.resolves(false);
		invalidate.resolves();
		saveUserIdentity.resolves(true);
		hasPermissionAsync.resolves(true);
		passwordPolicyValidate.returns(true);
		generatePassword.returns('random-pw');
		saveNewUser.resolves('new-uid');
		setPasswordUpdater.callsFake(async (updater: UpdaterImpl<any>, password: string) =>
			updater.set('services.password.bcrypt', `hash:${password}`),
		);
	});

	it('isUpdateUserData is true only for data with a non-empty _id', () => {
		expect(isUpdateUserData({ _id: 'uid' })).to.be.true;
		expect(isUpdateUserData({ _id: '' })).to.be.false;
		expect(isUpdateUserData({ username: 'jane' })).to.be.false;
	});

	describe('before saving', () => {
		it('refuses when the performing user does not exist', async () => {
			Users.findOneById.withArgs('admin').resolves(null);

			await expect(saveUser('admin', { _id: 'uid' })).to.be.rejectedWith('Invalid user [error-invalid-user]');
			expect(validateUserData.called).to.be.false;
		});

		it('refuses to edit a federated user', async () => {
			oldUser.federated = true;

			await expect(saveUser('admin', { _id: 'uid' })).to.be.rejectedWith(
				'Not possible to edit a federated user [Edit_Federated_User_Not_Allowed]',
			);
			expect(validateUserData.called).to.be.false;
		});

		it('validates the data, then runs beforeSaveUser with the old user', async () => {
			const userData = { _id: 'uid', language: 'pt' };
			const original = oldUser;

			await saveUser('admin', userData);

			expect(validateUserData.calledOnceWith('admin', userData)).to.be.true;
			expect(callbacksRun.firstCall.args).to.deep.equal(['beforeSaveUser', { user: userData, oldUser: original }]);
			sinon.assert.callOrder(validateUserData, callbacksRun, validateUserEditing);
		});

		it('refuses an update of a user that does not exist', async () => {
			Users.findOneById.withArgs('uid').resolves(null);

			await expect(saveUser('admin', { _id: 'uid' })).to.be.rejectedWith('User not found [error-user-not-found]');
			expect(validateUserEditing.called).to.be.false;
		});

		it('records the original user in the audit store and validates the edit', async () => {
			const auditStore = { setOriginalUser: sinon.stub(), setUpdateFilter: sinon.stub(), commitAuditEvent: sinon.stub() };
			const userData = { _id: 'uid', language: 'pt' };
			const original = oldUser;

			await saveUser('admin', userData, { auditStore });

			expect(auditStore.setOriginalUser.calledOnceWith(original)).to.be.true;
			expect(validateUserEditing.calledOnceWith('admin', userData)).to.be.true;
			sinon.assert.callOrder(auditStore.setOriginalUser, validateUserEditing, Users.getUpdater);
		});
	});

	describe('new user', () => {
		it('delegates to saveNewUser and returns its result', async () => {
			const userData = { username: 'new', password: 'pw' };

			expect(await saveUser('admin', userData)).to.equal('new-uid');
			expect(saveNewUser.calledOnceWith(userData, false, performer)).to.be.true;
			expect(callbacksRun.firstCall.args).to.deep.equal(['beforeSaveUser', { user: userData, oldUser: undefined }]);
			expect(validateUserEditing.called).to.be.false;
			expect(Users.getUpdater.called).to.be.false;
		});

		it('generates a random password that must be changed and asks to send it', async () => {
			const userData: Record<string, unknown> = { username: 'new', setRandomPassword: true };

			await saveUser('admin', userData);

			expect(userData).to.deep.equal({ username: 'new', password: 'random-pw', requirePasswordChange: true });
			expect(saveNewUser.calledOnceWith(userData, true, performer)).to.be.true;
		});

		it('drops a false setRandomPassword without generating a password', async () => {
			const userData: Record<string, unknown> = { username: 'new', password: 'pw', setRandomPassword: false };

			await saveUser('admin', userData);

			expect(generatePassword.called).to.be.false;
			expect(userData).to.deep.equal({ username: 'new', password: 'pw' });
			expect(saveNewUser.calledOnceWith(userData, false, performer)).to.be.true;
		});
	});

	describe('identity', () => {
		it('saves username and name with the updater and session', async () => {
			await saveUser('admin', { _id: 'uid', username: 'jane2', name: 'Jane' });

			const [identity] = saveUserIdentity.firstCall.args;
			expect(identity).to.include({ _id: 'uid', username: 'jane2', name: 'Jane', updateUsernameInBackground: true, session });
			expect(identity.updater).to.be.instanceOf(UpdaterImpl);
		});

		it('saves the identity when only the name key is present', async () => {
			await saveUser('admin', { _id: 'uid', name: undefined });

			expect(saveUserIdentity.calledOnce).to.be.true;
		});

		it('does not save the identity without username or name keys', async () => {
			await saveUser('admin', { _id: 'uid' });

			expect(saveUserIdentity.called).to.be.false;
		});

		it('throws when the identity cannot be saved', async () => {
			saveUserIdentity.resolves(false);

			await expect(saveUser('admin', { _id: 'uid', username: 'jane2' })).to.be.rejectedWith(
				'Could not save user identity [error-could-not-save-identity]',
			);
			expect(Users.updateFromUpdater.called).to.be.false;
		});
	});

	describe('status text', () => {
		it('sets the trimmed text cut to 120 characters and applies it as the own status after commit', async () => {
			oldUser.statusDefault = 'busy';

			await saveUser('admin', { _id: 'uid', statusText: `  ${'a'.repeat(130)}  ` });

			expect(isPresenceDisabledFor.firstCall.args).to.deep.equal(['uid']);
			expect(updateFilter).to.deep.equal({ $set: { statusText: 'a'.repeat(120) } });
			expect(setStatus.calledOnceWith('uid', 'busy', 'a'.repeat(120))).to.be.true;
			expect(refresh.called).to.be.false;
		});

		it('does not set an unchanged text nor ask for the presence state', async () => {
			oldUser.statusText = 'lunch';

			await saveUser('admin', { _id: 'uid', statusText: ' lunch ' });

			expect(isPresenceDisabledFor.called).to.be.false;
			expect(Users.updateFromUpdater.called).to.be.false;
			expect(setStatus.called).to.be.false;
		});

		it('treats an empty text as unchanged when the user has none', async () => {
			await saveUser('admin', { _id: 'uid', statusText: '   ' });

			expect(Users.updateFromUpdater.called).to.be.false;
			expect(setStatus.called).to.be.false;
		});

		it('does not set the text when the presence of the user is disabled', async () => {
			isPresenceDisabledFor.resolves(true);

			await saveUser('admin', { _id: 'uid', statusText: 'lunch' });

			expect(Users.updateFromUpdater.called).to.be.false;
			expect(setStatus.called).to.be.false;
		});

		it('uses the presence flag of this save instead of asking the service', async () => {
			await saveUser('admin', { _id: 'uid', statusText: 'lunch', presenceDisabledByAdmin: true });

			expect(isPresenceDisabledFor.called).to.be.false;
			expect(updateFilter).to.deep.equal({ $set: { presenceDisabledByAdmin: true } });
			expect(setStatus.called).to.be.false;
		});

		it('refreshes the presence before applying the text when the presence flag changed in this save', async () => {
			oldUser.presenceDisabledByAdmin = true;

			await saveUser('admin', { _id: 'uid', statusText: 'lunch', presenceDisabledByAdmin: false });

			expect(updateFilter).to.deep.equal({ $set: { statusText: 'lunch' }, $unset: { presenceDisabledByAdmin: 1 } });
			expect(refresh.calledOnceWith(['uid'])).to.be.true;
			expect(setStatus.calledOnceWith('uid', 'online', 'lunch')).to.be.true;
			sinon.assert.callOrder(invalidate, refresh, isPresenceDisabledFor, setStatus);
		});

		it('does not apply the text after commit when the presence is disabled by then', async () => {
			isPresenceDisabledFor.onFirstCall().resolves(false).onSecondCall().resolves(true);

			await saveUser('admin', { _id: 'uid', statusText: 'lunch' });

			expect(updateFilter).to.deep.equal({ $set: { statusText: 'lunch' } });
			expect(setStatus.called).to.be.false;
		});

		(
			[
				['online for a user without status default or source', {}, 'online'],
				['the default of a manual status', { statusSource: 'manual', statusDefault: 'away' }, 'away'],
				[
					'the previous manual default of a scheduled status that has not expired',
					{
						statusSource: 'calendar',
						previousState: { statusSource: 'manual', statusDefault: 'busy', statusExpiresAt: new Date(Date.now() + 60000) },
					},
					'busy',
				],
				[
					'the previous manual default without expiration',
					{ statusSource: 'calendar', previousState: { statusSource: 'manual', statusDefault: 'away' } },
					'away',
				],
				[
					'online when the previous manual status expired',
					{
						statusSource: 'calendar',
						previousState: { statusSource: 'manual', statusDefault: 'busy', statusExpiresAt: new Date(Date.now() - 60000) },
					},
					'online',
				],
				[
					'online when the previous status was not manual',
					{ statusSource: 'calendar', previousState: { statusSource: 'calendar', statusDefault: 'busy' } },
					'online',
				],
			] as const
		).forEach(([description, status, expected]) => {
			it(`applies ${description}`, async () => {
				Object.assign(oldUser, status);

				await saveUser('admin', { _id: 'uid', statusText: 'lunch' });

				expect(setStatus.calledOnceWith('uid', expected, 'lunch')).to.be.true;
			});
		});
	});

	describe('email', () => {
		it('sets an unverified email and sends the verification', async () => {
			await saveUser('admin', { _id: 'uid', email: 'jane@new.com' });

			const [uid, email, sendVerification, verified, updater] = setEmail.firstCall.args;
			expect([uid, email, sendVerification, verified]).to.deep.equal(['uid', 'jane@new.com', true, false]);
			expect(updater).to.be.instanceOf(UpdaterImpl);
		});

		it('sets a verified email without sending the verification', async () => {
			await saveUser('admin', { _id: 'uid', email: 'jane@new.com', verified: true });

			expect(setEmail.firstCall.args.slice(0, 4)).to.deep.equal(['uid', 'jane@new.com', false, true]);
		});

		it('marks the matching existing email as verified', async () => {
			await saveUser('admin', { _id: 'uid', email: 'jane@other.com', verified: true });

			expect(updateFilter).to.deep.equal({ $set: { 'emails.1.verified': true } });
		});

		it('marks the first email when no email is given', async () => {
			await saveUser('admin', { _id: 'uid', verified: false });

			expect(updateFilter).to.deep.equal({ $set: { 'emails.0.verified': false } });
		});

		it('marks no email when the given one is not among the existing ones', async () => {
			await saveUser('admin', { _id: 'uid', email: 'jane@new.com', verified: true });

			expect(Users.updateFromUpdater.called).to.be.false;
		});
	});

	describe('password', () => {
		it('sets the trimmed password when allowed and valid', async () => {
			await saveUser('admin', { _id: 'uid', password: '  pw  ' });

			expect(hasPermissionAsync.calledOnceWith('admin', 'edit-other-user-password')).to.be.true;
			expect(passwordPolicyValidate.calledOnceWith('  pw  ')).to.be.true;
			expect(updateFilter).to.deep.equal({ $set: { 'services.password.bcrypt': 'hash:pw' } });
		});

		it('ignores a blank password', async () => {
			await saveUser('admin', { _id: 'uid', password: '   ' });

			expect(hasPermissionAsync.called).to.be.false;
			expect(setPasswordUpdater.called).to.be.false;
		});

		it('ignores the password without edit-other-user-password', async () => {
			hasPermissionAsync.resolves(false);

			await saveUser('admin', { _id: 'uid', password: 'pw' });

			expect(passwordPolicyValidate.called).to.be.false;
			expect(setPasswordUpdater.called).to.be.false;
		});

		it('ignores a password the policy rejects', async () => {
			passwordPolicyValidate.returns(false);

			await saveUser('admin', { _id: 'uid', password: 'pw' });

			expect(setPasswordUpdater.called).to.be.false;
		});

		it('sets and emails a random password that must be changed', async () => {
			const userData: Record<string, unknown> = { _id: 'uid', setRandomPassword: true };

			await saveUser('admin', userData);

			expect(updateFilter).to.deep.equal({ $set: { 'services.password.bcrypt': 'hash:random-pw', 'requirePasswordChange': true } });
			expect(sendPasswordEmail.calledOnceWith(userData)).to.be.true;
			expect(userData).to.not.have.property('setRandomPassword');
		});

		it('does not email a random password that could not be set', async () => {
			hasPermissionAsync.resolves(false);

			await saveUser('admin', { _id: 'uid', setRandomPassword: true });

			expect(updateFilter).to.deep.equal({ $set: { requirePasswordChange: true } });
			expect(sendPasswordEmail.called).to.be.false;
		});
	});

	describe('profile fields', () => {
		it('sets bio, nickname, roles, preferences, language and the forced password change', async () => {
			await saveUser('admin', {
				_id: 'uid',
				bio: 'bio',
				nickname: 'nick',
				roles: ['user', 'bot'],
				settings: { preferences: { language: 'en' }, other: true } as any,
				language: 'pt',
				requirePasswordChange: true,
			});

			expect(updateFilter).to.deep.equal({
				$set: {
					bio: 'bio',
					nickname: 'nick',
					roles: ['user', 'bot'],
					settings: { preferences: { language: 'en' } },
					language: 'pt',
					requirePasswordChange: true,
				},
			});
		});

		it('unsets a blank bio and nickname, and the forced change reason when the change is no longer required', async () => {
			await saveUser('admin', { _id: 'uid', bio: ' ', nickname: '', requirePasswordChange: false });

			expect(updateFilter).to.deep.equal({
				$set: { requirePasswordChange: false },
				$unset: { bio: 1, nickname: 1, requirePasswordChangeReason: 1 },
			});
		});

		it('refuses a bio longer than 260 characters', async () => {
			await expect(saveUser('admin', { _id: 'uid', bio: 'a'.repeat(261) })).to.be.rejectedWith('[error-bio-size-exceeded]');
		});

		it('refuses a nickname longer than 120 characters', async () => {
			await expect(saveUser('admin', { _id: 'uid', nickname: 'a'.repeat(121) })).to.be.rejectedWith('[error-nickname-size-exceeded]');
		});

		it('ignores an empty language', async () => {
			await saveUser('admin', { _id: 'uid', language: '' });

			expect(Users.updateFromUpdater.called).to.be.false;
		});
	});

	describe('sip extension', () => {
		it('sets a changed extension', async () => {
			oldUser.sipExtension = '1000';

			await saveUser('admin', { _id: 'uid', sipExtension: '2000' });

			expect(updateFilter).to.deep.equal({ $set: { sipExtension: '2000' } });
		});

		it('unsets a blank extension', async () => {
			oldUser.sipExtension = '1000';

			await saveUser('admin', { _id: 'uid', sipExtension: '  ' });

			expect(updateFilter).to.deep.equal({ $unset: { sipExtension: 1 } });
		});

		it('ignores an unchanged extension', async () => {
			oldUser.sipExtension = '1000';

			await saveUser('admin', { _id: 'uid', sipExtension: '1000' });

			expect(Users.updateFromUpdater.called).to.be.false;
		});

		it('ignores an empty extension when the user has none', async () => {
			await saveUser('admin', { _id: 'uid', sipExtension: '' });

			expect(Users.updateFromUpdater.called).to.be.false;
		});
	});

	describe('phones', () => {
		it('sets the phones', async () => {
			await saveUser('admin', { _id: 'uid', phones: [{ phoneNumber: '+1' }] });

			expect(updateFilter).to.deep.equal({ $set: { phones: [{ phoneNumber: '+1' }] } });
			expect(notifyOnUserChange.firstCall.args[0].unset).to.deep.equal({});
		});

		it('unsets empty phones and notifies them as unset instead of in the diff', async () => {
			await saveUser('admin', { _id: 'uid', phones: [] });

			expect(updateFilter).to.deep.equal({ $unset: { phones: 1 } });
			expect(notifyOnUserChange.firstCall.args[0].unset).to.deep.equal({ phones: 1 });
			expect(notifyOnUserChange.firstCall.args[0].diff).to.not.have.property('phones');
		});
	});

	describe('presence disabled by admin', () => {
		it('sets the flag and invalidates the user for all viewers', async () => {
			await saveUser('admin', { _id: 'uid', presenceDisabledByAdmin: true });

			expect(updateFilter).to.deep.equal({ $set: { presenceDisabledByAdmin: true } });
			expect(invalidate.calledOnceWith(['uid'], { allViewers: true })).to.be.true;
		});

		it('unsets the flag', async () => {
			oldUser.presenceDisabledByAdmin = true;

			await saveUser('admin', { _id: 'uid', presenceDisabledByAdmin: false });

			expect(updateFilter).to.deep.equal({ $unset: { presenceDisabledByAdmin: 1 } });
			expect(invalidate.calledOnceWith(['uid'], { allViewers: true })).to.be.true;
		});

		it('ignores an unchanged flag', async () => {
			await saveUser('admin', { _id: 'uid', presenceDisabledByAdmin: false });

			expect(Users.updateFromUpdater.called).to.be.false;
			expect(invalidate.called).to.be.false;
		});

		it('swallows an invalidation failure', async () => {
			invalidate.rejects(new Error('boom'));

			expect(await saveUser('admin', { _id: 'uid', presenceDisabledByAdmin: true })).to.be.true;
			expect(notifyOnUserChange.calledOnce).to.be.true;
		});
	});

	describe('status visibility denied by admin', () => {
		it('resolves the usernames without the user itself and stores the ids, invalidating the user for its viewers', async () => {
			resolveUsersByUsernames.resolves({ ids: ['u1', 'u2'], usernames: ['one', 'two'] });

			await saveUser('admin', { _id: 'uid', statusVisibilityDeniedByAdmin: ['one', 'jane', 'two'] });

			expect(resolveUsersByUsernames.calledOnceWith(['one', 'two'])).to.be.true;
			expect(updateFilter).to.deep.equal({ $set: { statusVisibilityDeniedByAdmin: ['u1', 'u2'] } });
			expect(invalidate.calledOnceWith(['uid'], { allViewers: false })).to.be.true;
			expect(notifyOnUserChange.firstCall.args[0].diff).to.not.have.property('statusVisibilityDeniedByAdmin');
		});

		it('unsets the list when it becomes empty', async () => {
			oldUser.statusVisibilityDeniedByAdmin = ['u1'];
			resolveUsersByUsernames.resolves({ ids: [], usernames: [] });

			await saveUser('admin', { _id: 'uid', statusVisibilityDeniedByAdmin: [] });

			expect(updateFilter).to.deep.equal({ $unset: { statusVisibilityDeniedByAdmin: 1 } });
			expect(invalidate.calledOnceWith(['uid'], { allViewers: false })).to.be.true;
		});

		it('ignores the same ids in another order', async () => {
			oldUser.statusVisibilityDeniedByAdmin = ['u2', 'u1'];
			resolveUsersByUsernames.resolves({ ids: ['u1', 'u2'], usernames: ['one', 'two'] });

			await saveUser('admin', { _id: 'uid', statusVisibilityDeniedByAdmin: ['one', 'two'] });

			expect(Users.updateFromUpdater.called).to.be.false;
			expect(invalidate.called).to.be.false;
		});

		it('detects a replaced id with the same length', async () => {
			oldUser.statusVisibilityDeniedByAdmin = ['u1'];
			resolveUsersByUsernames.resolves({ ids: ['u3'], usernames: ['three'] });

			await saveUser('admin', { _id: 'uid', statusVisibilityDeniedByAdmin: ['three'] });

			expect(updateFilter).to.deep.equal({ $set: { statusVisibilityDeniedByAdmin: ['u3'] } });
		});

		it('does not resolve anything when the list is not given', async () => {
			await saveUser('admin', { _id: 'uid' });

			expect(resolveUsersByUsernames.called).to.be.false;
		});
	});

	it('saves custom fields with the updater and session', async () => {
		await saveUser('admin', { _id: 'uid', customFields: { team: 'a' } });

		const [uid, customFields, options] = saveCustomFields.firstCall.args;
		expect([uid, customFields]).to.deep.equal(['uid', { team: 'a' }]);
		expect(options.session).to.equal(session);
		expect(options._updater).to.be.instanceOf(UpdaterImpl);
	});

	it('writes the update with the session', async () => {
		await saveUser('admin', { _id: 'uid', language: 'pt' });

		const [query, , options] = Users.updateFromUpdater.firstCall.args;
		expect(query).to.deep.equal({ _id: 'uid' });
		expect(options).to.deep.equal({ session });
		expect(onceCommitted.calledOnceWith(session)).to.be.true;
		sinon.assert.callOrder(Users.updateFromUpdater, onceCommitted);
	});

	describe('after commit', () => {
		it('runs afterSaveUser and IPostUserUpdated with the saved user, then notifies the diff, and returns true', async () => {
			const original = oldUser;
			const emails = [
				{ address: 'jane@old.com', verified: false },
				{ address: 'jane@other.com', verified: true },
			];
			const savedUser = { _id: 'uid', username: 'jane', emails, roles: ['user'], statusText: 'x', language: 'pt' };

			expect(await saveUser('admin', { _id: 'uid', email: 'jane@other.com', verified: true, statusText: 'x', language: 'pt' })).to.be.true;

			expect(callbacksRun.secondCall.args).to.deep.equal(['afterSaveUser', { user: savedUser, oldUser: original }]);
			expect(triggerEvent.firstCall.args).to.deep.equal([
				'IPostUserUpdated',
				{ user: savedUser, previousUser: original, performedBy: performer },
			]);
			expect(notifyOnUserChange.firstCall.args).to.deep.equal([
				{
					clientAction: 'updated',
					id: 'uid',
					diff: { _id: 'uid', email: 'jane@other.com', language: 'pt', emails },
					unset: {},
				},
			]);
			expect(triggerEvent.calledOnce).to.be.true;
			expect(notifyOnUserChange.calledOnce).to.be.true;
			expect(sendPasswordEmail.called).to.be.false;
			sinon.assert.callOrder(callbacksRun, triggerEvent, notifyOnUserChange);
		});

		it('records the update, activation and username change in the audit store', async () => {
			const auditStore = { setOriginalUser: sinon.stub(), setUpdateFilter: sinon.stub(), commitAuditEvent: sinon.stub() };

			await saveUser('admin', { _id: 'uid', username: 'jane2', active: false, language: 'pt' }, { auditStore });

			expect(updateFilter).to.deep.equal({ $set: { language: 'pt' } });
			expect(auditStore.setUpdateFilter.calledOnceWith({ $set: { language: 'pt', active: false, username: 'jane2' } })).to.be.true;
			expect(auditStore.commitAuditEvent.calledOnce).to.be.true;
		});

		it('does not record the username in the audit store when it did not change', async () => {
			const auditStore = { setOriginalUser: sinon.stub(), setUpdateFilter: sinon.stub(), commitAuditEvent: sinon.stub() };

			await saveUser('admin', { _id: 'uid', username: 'jane', active: true }, { auditStore });

			expect(auditStore.setUpdateFilter.calledOnceWith({ $set: { active: true } })).to.be.true;
		});

		it('does not commit an audit event without changes', async () => {
			const auditStore = { setOriginalUser: sinon.stub(), setUpdateFilter: sinon.stub(), commitAuditEvent: sinon.stub() };

			await saveUser('admin', { _id: 'uid' }, { auditStore });

			expect(auditStore.setUpdateFilter.called).to.be.false;
			expect(auditStore.commitAuditEvent.called).to.be.false;
		});
	});

	describe('with DEBUG_DISABLE_USER_AUDIT', () => {
		afterEach(() => {
			delete process.env.DEBUG_DISABLE_USER_AUDIT;
			shouldBreakInVersion.reset();
		});

		it('saves without a session and ignores the audit store', async () => {
			process.env.DEBUG_DISABLE_USER_AUDIT = 'true';
			shouldBreakInVersion.returns(false);
			const { saveUser: saveUserWithoutAudit } = loadSaveUser();
			const auditStore = { setOriginalUser: sinon.stub(), setUpdateFilter: sinon.stub(), commitAuditEvent: sinon.stub() };

			expect(await saveUserWithoutAudit('admin', { _id: 'uid', language: 'pt' }, { auditStore })).to.be.true;

			expect(Users.updateFromUpdater.firstCall.args[2]).to.deep.equal({ session: undefined });
			expect(onceCommitted.calledOnceWith(undefined)).to.be.true;
			expect(auditStore.setOriginalUser.called).to.be.false;
		});

		it('refuses to load once version 9.0.0 is reached', () => {
			process.env.DEBUG_DISABLE_USER_AUDIT = 'true';
			shouldBreakInVersion.returns(true);

			expect(() => loadSaveUser()).to.throw('DEBUG_DISABLE_USER_AUDIT flag is deprecated and should be removed');
			expect(shouldBreakInVersion.calledWith('9.0.0')).to.be.true;
		});
	});
});
