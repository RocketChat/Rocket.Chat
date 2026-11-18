import { after, before, beforeEach, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const checkUsernameAvailability = sinon.stub();
const validateEmail = sinon.stub();
const addUserRolesAsync = sinon.stub();
const models = {
	Settings: {
		updateValueById: sinon.stub(),
	},
	Rooms: {
		findOneById: sinon.stub(),
		createWithIdTypeAndNameIfNotExists: sinon.stub(),
	},
	Users: {
		create: sinon.stub(),
		createIfNotExists: sinon.stub(),
		findOneById: sinon.stub(),
		findOneByEmailAddress: sinon.stub(),
		setAvatarData: sinon.stub(),
		removeById: sinon.stub(),
		setPasswordHash: sinon.stub(),
	},
	Roles: {
		countUsersInRole: sinon.stub(),
	},
};
const settingsGet = sinon.stub();
const avatarStore = {
	deleteByName: sinon.stub(),
	insert: sinon.stub(),
};

const { insertAdminUserFromEnv, insertInitialData } = proxyquire.noCallThru().load('./initialData', {
	'@rocket.chat/account-utils': {
		hashPassword: async (password: string) => `hashed=${password}`,
	},
	'meteor/meteor': {
		Meteor: {},
	},
	'../lib/media/file-upload': {
		FileUpload: { getStore: () => avatarStore },
	},
	'../lib/privateAssets': {
		readPrivateAsset: sinon.stub().resolves(Buffer.from('png')),
	},
	'../lib/rooms/addUserToDefaultChannels': {},
	'../lib/users/checkUsernameAvailability': {
		checkUsernameAvailability,
	},
	'../settings': {
		settings: { get: settingsGet },
	},
	'@rocket.chat/tools': {
		validateEmail,
	},
	'../lib/roles/addUserRoles': {
		addUserRolesAsync,
	},
});

describe('insertAdminUserFromEnv', () => {
	before(() => {
		mockModel('Users', models.Users);
		mockModel('Roles', models.Roles);
	});

	beforeEach(() => {
		checkUsernameAvailability.reset();
		validateEmail.reset();
		addUserRolesAsync.reset();
		models.Users.create.reset();
		models.Users.findOneByEmailAddress.reset();
		models.Users.setPasswordHash.reset();
		settingsGet.reset();
		process.env.ADMIN_PASS = 'pass';
		models.Roles.countUsersInRole.reset();
	});

	it('should do nothing if process.env.ADMIN_PASS is empty', async () => {
		process.env.ADMIN_PASS = '';
		const result = await insertAdminUserFromEnv();
		expect(result).to.be.undefined;
	});
	it('should do nothing if theres already an admin user', async () => {
		models.Roles.countUsersInRole.resolves(1);

		const result = await insertAdminUserFromEnv();
		expect(models.Roles.countUsersInRole.called).to.be.true;
		expect(validateEmail.called).to.be.false;
		expect(result).to.be.undefined;
	});
	it('should try to validate an email when process.env.ADMIN_EMAIL is set', async () => {
		process.env.ADMIN_EMAIL = 'email';
		models.Roles.countUsersInRole.resolves(0);
		validateEmail.returns(false);
		models.Users.create.returns({ insertedId: 'newuserid' });

		const result = await insertAdminUserFromEnv();
		expect(models.Roles.countUsersInRole.called).to.be.true;
		expect(validateEmail.called).to.be.true;
		expect(validateEmail.calledWith('email')).to.be.true;
		expect(models.Users.create.called).to.be.true;
		sinon.assert.calledOnceWithExactly(models.Users.setPasswordHash, 'newuserid', 'hashed=pass');
		expect(result).to.be.undefined;
	});
	it('should override the admins name when process.env.ADMIN_NAME is set', async () => {
		process.env.ADMIN_EMAIL = 'email';
		process.env.ADMIN_NAME = 'name';
		models.Roles.countUsersInRole.resolves(0);
		validateEmail.returns(true);
		validateEmail.returns(false);
		models.Users.create.returns({ insertedId: 'newuserid' });

		await insertAdminUserFromEnv();

		expect(
			models.Users.create.calledWith(
				sinon.match({
					name: 'name',
					username: 'admin',
					status: 'offline',
					statusDefault: 'online',
					utcOffset: 0,
					active: true,
					type: 'user',
				}),
			),
		).to.be.true;
	});
	it('should ignore the admin email when another user already has it set', async () => {
		process.env.ADMIN_EMAIL = 'email';
		models.Roles.countUsersInRole.resolves(0);
		validateEmail.returns(true);
		models.Users.create.returns({ insertedId: 'newuserid' });
		models.Users.findOneByEmailAddress.returns({ _id: 'someuser' });

		await insertAdminUserFromEnv();

		expect(models.Users.create.getCall(0).firstArg).to.not.to.have.property('email');
	});
	it('should add the email from env when its valid and no users are using it', async () => {
		process.env.ADMIN_EMAIL = 'email';
		models.Roles.countUsersInRole.resolves(0);
		validateEmail.returns(true);
		models.Users.create.returns({ insertedId: 'newuserid' });
		models.Users.findOneByEmailAddress.returns(undefined);

		await insertAdminUserFromEnv();

		expect(models.Users.create.getCall(0).firstArg)
			.to.have.property('emails')
			.to.deep.equal([{ address: 'email', verified: false }]);
	});
	it('should mark the admin email as verified when process.env.ADMIN_EMAIL_VERIFIED is set to true', async () => {
		process.env.ADMIN_EMAIL = 'email';
		process.env.ADMIN_EMAIL_VERIFIED = 'true';
		models.Roles.countUsersInRole.resolves(0);
		validateEmail.returns(true);
		models.Users.create.returns({ insertedId: 'newuserid' });
		models.Users.findOneByEmailAddress.returns(undefined);

		await insertAdminUserFromEnv();

		expect(models.Users.create.getCall(0).firstArg)
			.to.have.property('emails')
			.to.deep.equal([{ address: 'email', verified: true }]);
	});
	it('should validate a username with setting UTF8_User_Names_Validation when process.env.ADMIN_USERNAME is set', async () => {
		process.env.ADMIN_USERNAME = '1234';
		models.Roles.countUsersInRole.resolves(0);
		validateEmail.returns(true);
		settingsGet.returns('[0-9]+');
		models.Users.create.returns({ insertedId: 'newuserid' });

		await insertAdminUserFromEnv();

		expect(checkUsernameAvailability.called).to.be.true;
	});
	it('should override the username from admin if the env ADMIN_USERNAME is set, is valid and the username is available', async () => {
		process.env.ADMIN_USERNAME = '1234';
		models.Roles.countUsersInRole.resolves(0);
		validateEmail.returns(true);
		settingsGet.returns('[0-9]+');
		checkUsernameAvailability.returns(true);
		models.Users.create.returns({ insertedId: 'newuserid' });

		await insertAdminUserFromEnv();

		expect(models.Users.create.calledWith(sinon.match({ username: '1234' }))).to.be.true;
	});
	it('should ignore the username when it does not pass setting regexp validation', async () => {
		process.env.ADMIN_USERNAME = '1234';
		models.Roles.countUsersInRole.resolves(0);
		validateEmail.returns(true);
		settingsGet.returns('[A-Z]+');
		checkUsernameAvailability.returns(true);
		models.Users.create.returns({ insertedId: 'newuserid' });

		await insertAdminUserFromEnv();

		expect(models.Users.create.calledWith(sinon.match({ username: 'admin' }))).to.be.true;
	});
	it('should call addUserRolesAsync as the last step when all data is valid and all overrides are valid', async () => {
		process.env.ADMIN_EMAIL = 'email';
		process.env.ADMIN_NAME = 'name';
		process.env.ADMIN_USERNAME = '1234';
		process.env.ADMIN_EMAIL_VERIFIED = 'true';

		models.Roles.countUsersInRole.resolves(0);
		validateEmail.returns(true);
		settingsGet.returns('[0-9]+');
		checkUsernameAvailability.returns(true);
		models.Users.create.returns({ insertedId: 'newuserid' });
		models.Users.findOneByEmailAddress.returns(undefined);

		await insertAdminUserFromEnv();

		expect(addUserRolesAsync.called).to.be.true;
		expect(models.Users.setPasswordHash.called).to.be.true;
		expect(models.Users.create.calledWith(sinon.match({ name: 'name', username: '1234', emails: [{ address: 'email', verified: true }] })))
			.to.be.true;
	});
	it('should use the default nameValidation regex when the regex on the setting is invalid', async () => {
		process.env.ADMIN_NAME = 'name';
		process.env.ADMIN_USERNAME = '$$$$$$';

		models.Roles.countUsersInRole.resolves(0);
		settingsGet.returns('[');
		checkUsernameAvailability.returns(true);
		models.Users.create.returns({ insertedId: 'newuserid' });

		await insertAdminUserFromEnv();

		expect(models.Users.create.calledWith(sinon.match({ username: 'admin' })));
	});
	it('should ignore the username when is not available', async () => {
		process.env.ADMIN_USERNAME = '1234';

		models.Roles.countUsersInRole.resolves(0);
		checkUsernameAvailability.throws('some error');
		models.Users.create.returns({ insertedId: 'newuserid' });

		await insertAdminUserFromEnv();

		expect(models.Users.create.calledWith(sinon.match({ username: 'admin' }))).to.be.true;
	});
});

describe('initial data startup', () => {
	const runStartup = insertInitialData;
	const { TEST_MODE } = process.env;

	before(() => {
		mockModel('Settings', models.Settings);
		mockModel('Rooms', models.Rooms);
		mockModel('Users', models.Users);
		mockModel('Roles', models.Roles);
	});

	beforeEach(() => {
		delete process.env.TEST_MODE;
		process.env.ADMIN_PASS = '';
		addUserRolesAsync.reset();
		avatarStore.insert.reset();
		avatarStore.insert.resolves({ etag: 'etag' });
		settingsGet.reset();
		models.Rooms.findOneById.reset();
		models.Rooms.findOneById.resolves(null);
		models.Rooms.createWithIdTypeAndNameIfNotExists.reset();
		models.Rooms.createWithIdTypeAndNameIfNotExists.resolves({ upsertedCount: 1 });
		models.Users.findOneById.reset();
		models.Users.findOneById.resolves(null);
		models.Users.createIfNotExists.reset();
		models.Users.createIfNotExists.resolves({ upsertedCount: 1 });
		models.Settings.updateValueById.resolves({ modifiedCount: 0 });
		models.Roles.countUsersInRole.resolves(1);
	});

	after(() => {
		if (TEST_MODE === undefined) {
			delete process.env.TEST_MODE;
		} else {
			process.env.TEST_MODE = TEST_MODE;
		}
	});

	it('should create the GENERAL room without failing when another instance created it first', async () => {
		models.Rooms.createWithIdTypeAndNameIfNotExists.resolves({ upsertedCount: 0 });

		await runStartup();

		expect(models.Rooms.createWithIdTypeAndNameIfNotExists.calledOnceWith('GENERAL', 'c', 'general', { default: true })).to.be.true;
	});

	it('should set up rocket.cat only on the instance that created it', async () => {
		await runStartup();

		expect(addUserRolesAsync.calledOnceWith('rocket.cat', ['bot'])).to.be.true;
		expect(avatarStore.insert.calledOnce).to.be.true;
	});

	it('should not set up rocket.cat when another instance created it first', async () => {
		models.Users.createIfNotExists.resolves({ upsertedCount: 0 });

		await runStartup();

		expect(addUserRolesAsync.called).to.be.false;
		expect(avatarStore.insert.called).to.be.false;
	});

	it('should not write the GENERAL room or rocket.cat when they already exist', async () => {
		models.Rooms.findOneById.resolves({ _id: 'GENERAL' });
		models.Users.findOneById.resolves({ _id: 'rocket.cat' });

		await runStartup();

		expect(models.Rooms.createWithIdTypeAndNameIfNotExists.called).to.be.false;
		expect(models.Users.createIfNotExists.called).to.be.false;
		expect(addUserRolesAsync.called).to.be.false;
	});
});
