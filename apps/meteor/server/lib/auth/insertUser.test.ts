import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const Users = {
	insertOne: sinon.stub(),
	findOneById: sinon.stub(),
	findOneByRoleAndType: sinon.stub(),
};
const Roles = { findUsersInRole: sinon.stub() };
const Settings = { updateValueById: sinon.stub() };

const settingValues = new Map<string, unknown>();
const getNewUserRoles = sinon.stub();
const applyCustomOAuthUserFields = sinon.stub();
const runCallback = sinon.stub();
const runBeforeCreateUser = sinon.stub();
const sendEmail = sinon.stub();
const notifyOnSettingChangedById = sinon.stub();
const addUserRolesAsync = sinon.stub();
const joinDefaultChannels = sinon.stub();
const getAvatarSuggestionForUser = sinon.stub();
const setAvatarFromServiceWithValidation = sinon.stub();
const triggerEvent = sinon.stub();

let insertUser: any;

before(async () => {
	mock.module('@rocket.chat/apps', {
		exports: {
			Apps: { self: { isLoaded: () => true, triggerEvent, getRocketChatLogger: () => ({ error: sinon.stub() }) } },
			AppEvents: { IPostUserCreated: 'IPostUserCreated' },
		},
	});
	mock.module('./accountEmails', {
		exports: {
			getUserToActivateEmail: (options: { name?: string; email?: string }) => ({
				subject: 'Activate',
				html: `${options.name} ${options.email}`,
			}),
		},
	});
	mock.module('../../services/user/lib/getNewUserRoles', { exports: { getNewUserRoles } });
	mock.module('../../settings', { exports: { settings: { get: (key: string) => settingValues.get(key) } } });
	mock.module('../auth-providers/custom-oauth/customOAuth', { exports: { applyCustomOAuthUserFields } });
	mock.module('../callbacks', { exports: { callbacks: { run: runCallback } } });
	mock.module('../callbacks/beforeCreateUserCallback', { exports: { beforeCreateUserCallback: { run: runBeforeCreateUser } } });
	mock.module('../notifications/email/api', { exports: { send: sendEmail } });
	mock.module('../notifyListener', { exports: { notifyOnSettingChangedById } });
	mock.module('../roles/addUserRoles', { exports: { addUserRolesAsync } });
	mock.module('../rooms/joinDefaultChannels', { exports: { joinDefaultChannels } });
	mock.module('../users/getAvatarSuggestionForUser', { exports: { getAvatarSuggestionForUser } });
	mock.module('../users/setUserAvatar', { exports: { setAvatarFromServiceWithValidation } });
	({ insertUser } = await import('./insertUser'));
});

const insertedUser = () => Users.insertOne.firstCall.args[0];

describe('insertUser', () => {
	before(() => {
		mockModel('Users', Users);
		mockModel('Roles', Roles);
		mockModel('Settings', Settings);
	});

	beforeEach(() => {
		for (const stub of [
			...Object.values(Users),
			...Object.values(Roles),
			...Object.values(Settings),
			getNewUserRoles,
			applyCustomOAuthUserFields,
			runCallback,
			runBeforeCreateUser,
			sendEmail,
			notifyOnSettingChangedById,
			addUserRolesAsync,
			joinDefaultChannels,
			getAvatarSuggestionForUser,
			setAvatarFromServiceWithValidation,
			triggerEvent,
		]) {
			stub.reset();
		}

		settingValues.clear();
		settingValues.set('Accounts_Registration_AuthenticationServices_Enabled', true);
		Users.insertOne.resolves();
		Users.findOneByRoleAndType.resolves({ _id: 'existing-admin' });
		Users.findOneById.callsFake(async (_id: string) => ({ _id, username: 'alice', type: 'user', roles: ['user'] }));
		getNewUserRoles.callsFake((roles: string[]) => [...roles, 'user']);
		triggerEvent.resolves();
	});

	it('should insert a user with a Random id, defaults and the new-user roles', async () => {
		const userId = await insertUser({}, { username: 'alice', services: { password: { bcrypt: 'hash' } } });

		expect(userId).to.match(/^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17}$/);
		expect(insertedUser()).to.deep.include({
			_id: userId,
			username: 'alice',
			type: 'user',
			roles: [],
			status: 'offline',
			active: true,
		});
		expect(insertedUser().createdAt).to.be.instanceOf(Date);
		sinon.assert.calledOnceWithExactly(addUserRolesAsync, userId, ['user']);
		sinon.assert.calledOnceWithExactly(joinDefaultChannels, userId, undefined);
		sinon.assert.calledOnceWithMatch(triggerEvent, 'IPostUserCreated', { user: { _id: userId, username: 'alice' } });
	});

	it('should keep an _id and createdAt the caller already set', async () => {
		const createdAt = new Date('2020-01-01');
		const userId = await insertUser({}, { _id: 'imported-id', createdAt, username: 'alice' });

		expect(userId).to.equal('imported-id');
		expect(insertedUser()).to.include({ _id: 'imported-id', createdAt });
	});

	it('should merge global roles from the options and the user without storing them on the user', async () => {
		await insertUser({ globalRoles: ['bot'], skipNewUserRolesSetting: true }, { username: 'alice', globalRoles: ['livechat-agent'] });

		expect(insertedUser()).not.to.have.property('globalRoles');
		sinon.assert.notCalled(getNewUserRoles);
		expect(addUserRolesAsync.firstCall.args[1]).to.deep.equal(['bot', 'livechat-agent']);
	});

	it('should add the default authentication service roles to users without a password', async () => {
		settingValues.set('Accounts_Registration_AuthenticationServices_Default_Roles', 'user, external');

		await insertUser({ skipNewUserRolesSetting: true }, { username: 'alice', services: { github: { id: '1' } } });
		await insertUser(
			{ skipNewUserRolesSetting: true, skipAuthServiceDefaultRoles: true },
			{ username: 'bob', services: { github: { id: '2' } } },
		);

		expect(addUserRolesAsync.firstCall.args[1]).to.deep.equal(['user', 'external']);
		expect(addUserRolesAsync.secondCall.args[1]).to.deep.equal([]);
	});

	it('should make the first user an admin and move the setup wizard forward', async () => {
		Users.findOneByRoleAndType.resolves(null);
		settingValues.set('Show_Setup_Wizard', 'pending');
		Settings.updateValueById.resolves({ modifiedCount: 1 });

		await insertUser({}, { username: 'alice' });

		expect(addUserRolesAsync.firstCall.args[1]).to.deep.equal(['user', 'admin']);
		sinon.assert.calledOnceWithExactly(Settings.updateValueById, 'Show_Setup_Wizard', 'in_progress');
		sinon.assert.calledOnceWithExactly(notifyOnSettingChangedById, 'Show_Setup_Wizard');
	});

	it('should not look for an admin when skipAdminCheck is set', async () => {
		Users.findOneByRoleAndType.resolves(null);

		await insertUser({ skipAdminCheck: true }, { username: 'alice' });

		sinon.assert.notCalled(Users.findOneByRoleAndType);
		expect(addUserRolesAsync.firstCall.args[1]).to.deep.equal(['user']);
	});

	it('should fill the name and email from the external service', async () => {
		settingValues.set('Accounts_Verify_Email_For_External_Accounts', true);

		await insertUser({}, { services: { github: { id: '1', username: 'gh-alice', email: 'alice@example.com' } } });

		expect(insertedUser()).to.deep.include({ name: 'gh-alice', emails: [{ address: 'alice@example.com', verified: true }] });
	});

	it('should prefer the name in the options over the profile name', async () => {
		await insertUser({ name: 'Alice', profile: { name: 'Profile' } }, { username: 'alice' });
		await insertUser({ profile: { name: 'Profile' } }, { username: 'bob' });

		expect(Users.insertOne.firstCall.args[0].name).to.equal('Alice');
		expect(Users.insertOne.secondCall.args[0].name).to.equal('Profile');
		expect(Users.insertOne.secondCall.args[0]).not.to.have.property('profile');
	});

	it('should leave users pending approval and email the admins when approval is manual', async () => {
		settingValues.set('Accounts_ManuallyApproveNewUsers', true);
		Roles.findUsersInRole.resolves([{ name: 'Admin', emails: [{ address: 'admin@example.com' }] }]);

		await insertUser({ reason: 'hi' }, { username: 'alice', emails: [{ address: 'alice@example.com', verified: false }] });

		expect(insertedUser()).to.include({ active: false, inactiveReason: 'pending_approval' });
		sinon.assert.calledOnceWithMatch(sendEmail, {
			to: ['Admin<admin@example.com>'],
			subject: 'Activate',
			html: 'undefined alice@example.com',
		});
	});

	it('should not email the admins when skipAdminEmail is set', async () => {
		settingValues.set('Accounts_ManuallyApproveNewUsers', true);

		await insertUser({ skipAdminEmail: true }, { username: 'alice' });

		sinon.assert.notCalled(Roles.findUsersInRole);
		sinon.assert.notCalled(sendEmail);
	});

	it('should opt new users into email two-factor authentication when configured', async () => {
		settingValues.set('Accounts_TwoFactorAuthentication_Enabled', true);
		settingValues.set('Accounts_TwoFactorAuthentication_By_Email_Enabled', true);
		settingValues.set('Accounts_TwoFactorAuthentication_By_Email_Auto_Opt_In', true);

		await insertUser({}, { username: 'alice' });

		expect(insertedUser().services.email2fa.enabled).to.equal(true);
	});

	it('should run the creation callbacks unless skipped', async () => {
		await insertUser({}, { username: 'alice' });
		sinon.assert.calledOnce(runBeforeCreateUser);
		sinon.assert.calledWith(runCallback, 'onCreateUser');

		runBeforeCreateUser.resetHistory();
		runCallback.resetHistory();
		await insertUser({ skipBeforeCreateUserCallback: true, skipOnCreateUserCallback: true }, { username: 'bob' });
		sinon.assert.notCalled(runBeforeCreateUser);
		sinon.assert.neverCalledWith(runCallback, 'onCreateUser');
	});

	it('should apply the custom OAuth field mapping before inserting', async () => {
		applyCustomOAuthUserFields.callsFake((user: { username?: string }) => {
			user.username = 'mapped';
		});

		await insertUser({}, { services: { custom: { id: '1' } } });

		expect(insertedUser().username).to.equal('mapped');
	});

	describe('default avatar', () => {
		beforeEach(() => {
			settingValues.set('Accounts_SetDefaultAvatar', true);
		});

		it('should set the avatar from the first suggested service', async () => {
			getAvatarSuggestionForUser.resolves({
				github: { blob: 'data:image/png;base64,Z2g=' },
				gitlab: { blob: 'data:image/png;base64,Z2w=' },
			});

			const userId = await insertUser({}, { username: 'alice' });

			const createdUser = { _id: userId, username: 'alice', type: 'user', roles: ['user'] };
			sinon.assert.calledOnceWithExactly(getAvatarSuggestionForUser, createdUser);
			sinon.assert.calledOnceWithExactly(setAvatarFromServiceWithValidation, userId, 'data:image/png;base64,Z2g=', '', 'github');
		});

		it('should leave the avatar unset when no service suggests one', async () => {
			getAvatarSuggestionForUser.resolves({});

			await insertUser({}, { username: 'alice' });

			sinon.assert.calledOnce(getAvatarSuggestionForUser);
			sinon.assert.notCalled(setAvatarFromServiceWithValidation);
		});

		it('should not look for an avatar when the setting is off, skipDefaultAvatar is set or the user has no username', async () => {
			await insertUser({ skipDefaultAvatar: true }, { username: 'alice' });

			Users.findOneById.callsFake(async (_id: string) => ({ _id, type: 'user', roles: ['user'] }));
			await insertUser({}, { emails: [{ address: 'bob@example.com', verified: false }] });

			Users.findOneById.callsFake(async (_id: string) => ({ _id, username: 'carol', type: 'user', roles: ['user'] }));
			settingValues.set('Accounts_SetDefaultAvatar', false);
			await insertUser({}, { username: 'carol' });

			sinon.assert.notCalled(getAvatarSuggestionForUser);
			sinon.assert.notCalled(setAvatarFromServiceWithValidation);
		});
	});

	describe('validation', () => {
		it('should reject external users when registration through authentication services is disabled', async () => {
			settingValues.set('Accounts_Registration_AuthenticationServices_Enabled', false);
			settingValues.set('LDAP_Enable', false);

			await expect(insertUser({}, { services: { github: { id: '1' } } })).to.be.rejectedWith(
				'registration-disabled-authentication-services',
			);
			sinon.assert.notCalled(Users.insertOne);

			await insertUser({}, { username: 'alice', services: { password: { bcrypt: 'hash' } } });
			sinon.assert.calledOnce(Users.insertOne);
		});

		it('should reject an email outside the allowed domains', async () => {
			settingValues.set('Accounts_AllowedDomainsList', 'example.com, example.org');

			await expect(insertUser({}, { username: 'alice', emails: [{ address: 'alice@evil.com', verified: false }] })).to.be.rejectedWith(
				'error-invalid-domain',
			);
			sinon.assert.notCalled(Users.insertOne);

			await insertUser({}, { username: 'bob', emails: [{ address: 'bob@example.org', verified: false }] });
			sinon.assert.calledOnce(Users.insertOne);
		});

		it('should not validate visitors', async () => {
			settingValues.set('Accounts_Registration_AuthenticationServices_Enabled', false);
			settingValues.set('LDAP_Enable', false);
			settingValues.set('Accounts_AllowedDomainsList', 'example.com');

			await insertUser({}, { type: 'visitor', services: {}, emails: [{ address: 'v@evil.com', verified: false }] });

			sinon.assert.calledOnce(Users.insertOne);
		});
	});

	describe('duplicate keys', () => {
		it('should report a duplicate username', async () => {
			Users.insertOne.rejects(Object.assign(new Error('dup'), { errmsg: 'E11000 duplicate key error index: username_1' }));

			await expect(insertUser({}, { username: 'alice' })).to.be.rejectedWith('Username already exists.');
		});

		it('should report a duplicate email', async () => {
			Users.insertOne.rejects(Object.assign(new Error('dup'), { errmsg: 'E11000 duplicate key error index: emails.address_1' }));

			await expect(insertUser({}, { username: 'alice' })).to.be.rejectedWith('Email already exists.');
		});

		it('should rethrow other insert errors', async () => {
			const error = new Error('network');
			Users.insertOne.rejects(error);

			await expect(insertUser({}, { username: 'alice' })).to.be.rejectedWith(error);
		});
	});
});
