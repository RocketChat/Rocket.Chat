import { expect } from 'chai';
import { beforeEach, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const getUsersInRole = sinon.stub();
const checkUsernameAvailability = sinon.stub();
const validateEmail = sinon.stub();
const addUserRolesAsync = sinon.stub();
const models = {
	Settings: {},
	Rooms: {},
	Users: {
		create: sinon.stub(),
		findOneByEmailAddress: sinon.stub(),
	},
};
const setPasswordAsync = sinon.stub();
const settingsGet = sinon.stub();

const { insertAdminUserFromEnv } = proxyquire.noCallThru().load('../../../../server/startup/initialData.js', {
	'meteor/accounts-base': {
		Accounts: {
			setPasswordAsync,
		},
	},
	'meteor/meteor': {
		Meteor: {
			startup: sinon.stub(),
		},
	},
	'../../app/authorization/server': {
		getUsersInRole,
	},
	'../../app/file-upload/server': {},
	'../../app/file/server': {},
	'../../app/lib/server/functions/addUserToDefaultChannels': {},
	'../../app/lib/server/functions/checkUsernameAvailability': {
		checkUsernameAvailability,
	},
	'../../app/settings/server': {
		settings: { get: settingsGet },
	},
	'../../lib/emailValidator': {
		validateEmail,
	},
	'../lib/roles/addUserRoles': {
		addUserRolesAsync,
	},
	'@rocket.chat/models': models,
});

describe('insertAdminUserFromEnv', () => {
	beforeEach(() => {
		getUsersInRole.reset();
		checkUsernameAvailability.reset();
		validateEmail.reset();
		addUserRolesAsync.reset();
		models.Users.create.reset();
		models.Users.findOneByEmailAddress.reset();
		setPasswordAsync.reset();
		settingsGet.reset();
		process.env.ADMIN_PASS = 'pass';
	});

	it('should do nothing if process.env.ADMIN_PASS is empty', async () => {
		process.env.ADMIN_PASS = '';
		const result = await insertAdminUserFromEnv();
		expect(getUsersInRole.called).to.be.false;
		expect(result).to.be.undefined;
	});
	it('should do nothing if theres already an admin user', async () => {
		getUsersInRole.returns({ count: () => 1 });

		const result = await insertAdminUserFromEnv();
		expect(getUsersInRole.called).to.be.true;
		expect(validateEmail.called).to.be.false;
		expect(result).to.be.undefined;
	});
	it('should try to validate an email when process.env.ADMIN_EMAIL is set', async () => {
		process.env.ADMIN_EMAIL = 'email';
		getUsersInRole.returns({ count: () => 0 });
		validateEmail.returns(false);
		models.Users.create.returns({ insertedId: 'newuserid' });

		const result = await insertAdminUserFromEnv();
		expect(getUsersInRole.called).to.be.true;
		expect(validateEmail.called).to.be.true;
		expect(validateEmail.calledWith('email')).to.be.true;
		expect(models.Users.create.called).to.be.true;
		expect(setPasswordAsync.called).to.be.true;
		expect(result).to.be.undefined;
	});
	it('should override the admins name when process.env.ADMIN_NAME is set', async () => {
		process.env.ADMIN_EMAIL = 'email';
		process.env.ADMIN_NAME = 'name';
		getUsersInRole.returns({ count: () => 0 });
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
		getUsersInRole.returns({ count: () => 0 });
		validateEmail.returns(true);
		models.Users.create.returns({ insertedId: 'newuserid' });
		models.Users.findOneByEmailAddress.returns({ _id: 'someuser' });

		await insertAdminUserFromEnv();

		expect(models.Users.create.getCall(0).firstArg).to.not.to.have.property('email');
	});
	it('should add the email from env when its valid and no users are using it', async () => {
		process.env.ADMIN_EMAIL = 'email';
		getUsersInRole.returns({ count: () => 0 });
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
		getUsersInRole.returns({ count: () => 0 });
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
		getUsersInRole.returns({ count: () => 0 });
		validateEmail.returns(true);
		settingsGet.returns('[0-9]+');
		models.Users.create.returns({ insertedId: 'newuserid' });

		await insertAdminUserFromEnv();

		expect(checkUsernameAvailability.called).to.be.true;
	});
	it('should override the username from admin if the env ADMIN_USERNAME is set, is valid and the username is available', async () => {
		process.env.ADMIN_USERNAME = '1234';
		getUsersInRole.returns({ count: () => 0 });
		validateEmail.returns(true);
		settingsGet.returns('[0-9]+');
		checkUsernameAvailability.returns(true);
		models.Users.create.returns({ insertedId: 'newuserid' });

		await insertAdminUserFromEnv();

		expect(models.Users.create.calledWith(sinon.match({ username: '1234' }))).to.be.true;
	});
	it('should ignore the username when it does not pass setting regexp validation', async () => {
		process.env.ADMIN_USERNAME = '1234';
		getUsersInRole.returns({ count: () => 0 });
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

		getUsersInRole.returns({ count: () => 0 });
		validateEmail.returns(true);
		settingsGet.returns('[0-9]+');
		checkUsernameAvailability.returns(true);
		models.Users.create.returns({ insertedId: 'newuserid' });
		models.Users.findOneByEmailAddress.returns(undefined);

		await insertAdminUserFromEnv();

		expect(addUserRolesAsync.called).to.be.true;
		expect(setPasswordAsync.called).to.be.true;
		expect(models.Users.create.calledWith(sinon.match({ name: 'name', username: '1234', emails: [{ address: 'email', verified: true }] })))
			.to.be.true;
	});
	it('should use the default nameValidation regex when the regex on the setting is invalid', async () => {
		process.env.ADMIN_NAME = 'name';
		process.env.ADMIN_USERNAME = '$$$$$$';

		getUsersInRole.returns({ count: () => 0 });
		settingsGet.returns('[');
		checkUsernameAvailability.returns(true);
		models.Users.create.returns({ insertedId: 'newuserid' });

		await insertAdminUserFromEnv();

		expect(models.Users.create.calledWith(sinon.match({ username: 'admin' })));
	});
	it('should ignore the username when is not available', async () => {
		process.env.ADMIN_USERNAME = '1234';

		getUsersInRole.returns({ count: () => 0 });
		checkUsernameAvailability.throws('some error');
		models.Users.create.returns({ insertedId: 'newuserid' });

		await insertAdminUserFromEnv();

		expect(models.Users.create.calledWith(sinon.match({ username: 'admin' }))).to.be.true;
	});
});
