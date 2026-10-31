import { after, before, beforeEach, describe, it } from 'node:test';

import type { IRolesModel, IRoomsModel, IUsersModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { SAMLUtils } from './Utils';
import type { ISAMLUser } from '../definition/ISAMLUser';

const NEW_USER_ID = 'new-user-id';

const settingsGet = sinon.stub();
const insertUserDoc = sinon.stub();
const addUserToRoom = sinon.stub();
const createRoom = sinon.stub();
const saveUserIdentity = sinon.stub();
const updateOne = sinon.stub();
const addPersonalAccessTokenToUser = sinon.stub();
const findRoomByNameAndType = sinon.stub();
const generateUsernameSuggestion = sinon.stub();

type StoredUser = { _id: string; username?: string; name?: string; emails?: { address: string }[]; services?: Record<string, any> };

let users: StoredUser[];
let existingRoles: { _id: string; name: string }[];

const matchesQuery = (user: StoredUser, query: Record<string, any>) =>
	Object.entries(query).every(([path, expected]) => {
		if (path === 'emails.address') {
			return user.emails?.some(({ address }) => expected.test(address));
		}
		if (path === 'username') {
			return user.username === expected;
		}
		return user.services?.saml?.[path.replace('services.saml.', '')] === expected;
	});

const { SAML } = proxyquire.noCallThru().load('./SAML', {
	'meteor/accounts-base': {
		Accounts: { insertUserDoc, _generateStampedLoginToken: () => ({ token: 'login-token', when: new Date() }) },
	},
	'meteor/meteor': { Meteor: {} },
	'./ServiceProvider': {},
	'../../../../../lib/i18n': { i18n: { languages: ['en', 'pt-BR'] } },
	'../../../../../server/lib/rooms/addUserToRoom': { addUserToRoom },
	'../../../../../server/lib/rooms/createRoom': { createRoom },
	'../../../../../server/lib/users/getUsernameSuggestion': { generateUsernameSuggestion },
	'../../../../../server/lib/users/saveUserIdentity': { saveUserIdentity },
	'../../../../../server/settings': { settings: { get: settingsGet } },
});

const buildUserObject = (overrides: Partial<ISAMLUser> = {}): ISAMLUser => ({
	samlLogin: { provider: 'test-sp', idp: 'issuer', idpSession: 'session', nameID: 'name-id' },
	emailList: ['jane.doe@company.com'],
	fullName: 'Jane Doe',
	eppn: null,
	username: 'jane.doe',
	attributeList: new Map(),
	identifier: { type: 'email' },
	...overrides,
});

const customIdentifier = (value: string) => ({
	identifier: { type: 'custom', attribute: 'employeeId' },
	attributeList: new Map([['employeeId', value]]),
});

const createdUser = () => insertUserDoc.firstCall.args[1];
const createOptions = () => insertUserDoc.firstCall.args[0];
const updatedFields = () => updateOne.firstCall.args[1].$set;

describe('SAML.insertOrUpdateSAMLUser', () => {
	const originalSettings = { ...SAMLUtils.globalSettings };

	before(() => {
		registerModel('IUsersModel', {
			findOne: async (query: Record<string, any>) => users.find((user) => matchesQuery(user, query)) ?? null,
			findOneById: async (id: string) => users.find((user) => user._id === id) ?? null,
			updateOne,
			addPersonalAccessTokenToUser,
		} as unknown as IUsersModel);
		registerModel('IRolesModel', {
			findInIdsOrNames: (names: string[]) => ({
				toArray: async () => existingRoles.filter(({ _id, name }) => names.includes(_id) || names.includes(name)),
			}),
		} as unknown as IRolesModel);
		registerModel('IRoomsModel', { findOneByNameAndType: findRoomByNameAndType } as unknown as IRoomsModel);
	});

	after(() => {
		Object.assign(SAMLUtils.globalSettings, originalSettings);
	});

	beforeEach(() => {
		for (const stub of [
			settingsGet,
			insertUserDoc,
			addUserToRoom,
			createRoom,
			saveUserIdentity,
			updateOne,
			addPersonalAccessTokenToUser,
			findRoomByNameAndType,
			generateUsernameSuggestion,
		]) {
			stub.reset();
		}

		users = [];
		existingRoles = [
			{ _id: 'user', name: 'user' },
			{ _id: 'auditor-id', name: 'auditor' },
		];
		insertUserDoc.callsFake(async (_options, user) => {
			users.push({ ...user, _id: NEW_USER_ID });
			return NEW_USER_ID;
		});
		findRoomByNameAndType.resolves(null);
		Object.assign(SAMLUtils.globalSettings, {
			generateUsername: false,
			nameOverwrite: false,
			mailOverwrite: false,
			immutableProperty: 'EMail',
			defaultUserRole: '',
			channelsAttributeUpdate: false,
			includePrivateChannelsInUpdate: false,
		});
	});

	describe('finding the user', () => {
		it('should prefer the user linked to the custom identifier over the user with the same email', async () => {
			users = [
				{ _id: 'same-email', emails: [{ address: 'jane.doe@company.com' }] },
				{ _id: 'linked', services: { saml: { employeeId: 'E-1' } } },
			];

			const { userId } = await SAML.insertOrUpdateSAMLUser(buildUserObject(customIdentifier('E-1')));

			expect(userId).to.equal('linked');
			expect(updatedFields()).to.not.have.property('services.saml.employeeId');
		});

		it('should look for the email when the response does not carry the custom identifier', async () => {
			users = [{ _id: 'same-email', emails: [{ address: 'jane.doe@company.com' }] }];

			const { userId } = await SAML.insertOrUpdateSAMLUser(buildUserObject({ identifier: { type: 'custom', attribute: 'employeeId' } }));

			expect(userId).to.equal('same-email');
			expect(updatedFields()).to.not.have.property('services.saml.employeeId');
		});

		it('should ignore a custom attribute when users are not identified by it', async () => {
			users = [{ _id: 'linked', services: { saml: { employeeId: 'E-1' } } }];

			const { userId } = await SAML.insertOrUpdateSAMLUser(
				buildUserObject({ ...customIdentifier('E-1'), identifier: { type: 'email', attribute: 'employeeId' } }),
			);

			expect(userId).to.equal(NEW_USER_ID);
		});

		it('should find a user by any of the emails from the IdP', async () => {
			users = [{ _id: 'existing', emails: [{ address: 'second@company.com' }] }];

			const { userId } = await SAML.insertOrUpdateSAMLUser(buildUserObject({ emailList: ['first@company.com', 'second@company.com'] }));

			expect(userId).to.equal('existing');
		});

		it('should link the custom identifier to a user found by email', async () => {
			users = [{ _id: 'same-email', emails: [{ address: 'jane.doe@company.com' }] }];

			const { userId } = await SAML.insertOrUpdateSAMLUser(buildUserObject(customIdentifier('E-1')));

			expect(userId).to.equal('same-email');
			expect(updatedFields()).to.have.property('services.saml.employeeId', 'E-1');
		});

		it('should match an email whatever its letter case', async () => {
			users = [{ _id: 'existing', emails: [{ address: 'Jane.Doe@Company.com' }] }];

			const { userId } = await SAML.insertOrUpdateSAMLUser(buildUserObject());

			expect(userId).to.equal('existing');
		});

		it('should not log in as a user whose email only looks like the one from the IdP', async () => {
			users = [{ _id: 'lookalike', emails: [{ address: 'janexdoe@company.com' }] }];

			const { userId } = await SAML.insertOrUpdateSAMLUser(buildUserObject());

			expect(userId).to.equal(NEW_USER_ID);
		});

		it('should not log in as a user whose email only contains the one from the IdP', async () => {
			users = [{ _id: 'longer', emails: [{ address: 'not-jane.doe@company.com.attacker.example' }] }];

			const { userId } = await SAML.insertOrUpdateSAMLUser(buildUserObject());

			expect(userId).to.equal(NEW_USER_ID);
		});

		it('should not log in as a user with the same email when users are identified by username', async () => {
			SAMLUtils.globalSettings.immutableProperty = 'Username';
			users = [{ _id: 'same-email', username: 'someone.else', emails: [{ address: 'jane.doe@company.com' }] }];

			const { userId } = await SAML.insertOrUpdateSAMLUser(buildUserObject());

			expect(userId).to.equal(NEW_USER_ID);
		});

		it('should not log in as a user with no username when the IdP sends none and users are identified by username', async () => {
			SAMLUtils.globalSettings.immutableProperty = 'Username';
			users = [{ _id: 'no-username' }];

			const { userId } = await SAML.insertOrUpdateSAMLUser(buildUserObject({ username: undefined }));

			expect(userId).to.equal(NEW_USER_ID);
		});

		it('should return a login token that is stored for the user', async () => {
			users = [{ _id: 'existing', emails: [{ address: 'jane.doe@company.com' }] }];

			const { token } = await SAML.insertOrUpdateSAMLUser(buildUserObject());

			expect(token).to.equal('login-token');
			expect(addPersonalAccessTokenToUser.firstCall.args[0]).to.have.property('userId', 'existing');
		});

		it('should store the IdP session on that user only, for single logout', async () => {
			users = [{ _id: 'existing', emails: [{ address: 'jane.doe@company.com' }] }];

			await SAML.insertOrUpdateSAMLUser(buildUserObject());

			expect(updateOne.firstCall.args[0]).to.deep.equal({ _id: 'existing' });
			expect(updatedFields()).to.include({
				'services.saml.provider': 'test-sp',
				'services.saml.idp': 'issuer',
				'services.saml.idpSession': 'session',
				'services.saml.nameID': 'name-id',
			});
		});
	});

	describe('roles of a new user', () => {
		it('should use the roles from the IdP and skip the default roles of the auth service', async () => {
			await SAML.insertOrUpdateSAMLUser(buildUserObject({ roles: ['auditor'] }));

			expect(createdUser().globalRoles).to.deep.equal(['auditor-id']);
			expect(createOptions().skipAuthServiceDefaultRoles).to.be.true;
			expect(createOptions().skipNewUserRolesSetting).to.be.true;
		});

		it('should use the configured default roles when the IdP sends none', async () => {
			SAMLUtils.globalSettings.defaultUserRole = 'user, auditor';

			await SAML.insertOrUpdateSAMLUser(buildUserObject());

			expect(createdUser().globalRoles).to.have.members(['user', 'auditor-id']);
		});

		it('should use the configured default roles when the IdP sends an empty list', async () => {
			SAMLUtils.globalSettings.defaultUserRole = 'auditor';

			await SAML.insertOrUpdateSAMLUser(buildUserObject({ roles: [] }));

			expect(createdUser().globalRoles).to.deep.equal(['auditor-id']);
		});

		it('should keep the default roles of the auth service when SAML provides no role', async () => {
			await SAML.insertOrUpdateSAMLUser(buildUserObject());

			expect(createdUser().globalRoles).to.deep.equal([]);
			expect(createOptions().skipAuthServiceDefaultRoles).to.be.false;
		});

		it('should create the user with the mapped roles that exist', async () => {
			await SAML.insertOrUpdateSAMLUser(buildUserObject({ roles: ['auditor', 'missing-role'] }));

			expect(createdUser().globalRoles).to.deep.equal(['auditor-id']);
		});

		it('should refuse the login and create no user when no mapped role exists', async () => {
			await expect(SAML.insertOrUpdateSAMLUser(buildUserObject({ roles: ['missing-role'] }))).to.be.rejectedWith(
				'We should have at least one existing role',
			);

			expect(insertUserDoc.called).to.be.false;
		});

		it('should refuse the login and create no user when the mapped roles are blank', async () => {
			await expect(SAML.insertOrUpdateSAMLUser(buildUserObject({ roles: [' '] }))).to.be.rejectedWith('No valid role names');

			expect(insertUserDoc.called).to.be.false;
		});
	});

	describe('roles of an existing user', () => {
		beforeEach(() => {
			users = [{ _id: 'existing', username: 'jane.doe', emails: [{ address: 'jane.doe@company.com' }] }];
		});

		it('should replace the roles with the ones from the IdP', async () => {
			await SAML.insertOrUpdateSAMLUser(buildUserObject({ roles: ['auditor'] }));

			expect(updatedFields().roles).to.deep.equal(['auditor-id']);
		});

		it('should keep the roles when the IdP sends none', async () => {
			await SAML.insertOrUpdateSAMLUser(buildUserObject());

			expect(updatedFields()).to.not.have.property('roles');
		});
	});

	describe('profile of a new user', () => {
		it('should create an inactive user when an admin must approve new users', async () => {
			settingsGet.withArgs('Accounts_ManuallyApproveNewUsers').returns(true);

			await SAML.insertOrUpdateSAMLUser(buildUserObject());

			expect(createdUser().active).to.be.false;
		});

		it('should mark the IdP email as verified when the server is set to verify external accounts', async () => {
			settingsGet.withArgs('Accounts_Verify_Email_For_External_Accounts').returns(true);

			await SAML.insertOrUpdateSAMLUser(buildUserObject());

			expect(createdUser().emails).to.deep.equal([{ address: 'jane.doe@company.com', verified: true }]);
		});

		it('should ignore a language the server does not have', async () => {
			await SAML.insertOrUpdateSAMLUser(buildUserObject({ language: 'xx' }));

			expect(createdUser()).to.not.have.property('language');
		});

		it('should keep a language the server has', async () => {
			await SAML.insertOrUpdateSAMLUser(buildUserObject({ language: 'pt-BR' }));

			expect(createdUser().language).to.equal('pt-BR');
		});

		it('should record the provider, the IdP and the custom identifier of the user', async () => {
			await SAML.insertOrUpdateSAMLUser(buildUserObject(customIdentifier('E-1')));

			expect(createdUser().services.saml).to.deep.equal({ provider: 'test-sp', idp: 'issuer', employeeId: 'E-1' });
		});

		it('should use the username and the name from the IdP', async () => {
			await SAML.insertOrUpdateSAMLUser(buildUserObject());

			expect(createdUser()).to.include({ username: 'jane.doe', name: 'Jane Doe' });
		});

		it('should use a generated username when the server is set to generate them', async () => {
			SAMLUtils.globalSettings.generateUsername = true;
			generateUsernameSuggestion.resolves('jane.doe.2');

			await SAML.insertOrUpdateSAMLUser(buildUserObject());

			expect(createdUser().username).to.equal('jane.doe.2');
		});

		it('should guess the name from the username when the IdP sends no name', async () => {
			await SAML.insertOrUpdateSAMLUser(buildUserObject({ fullName: null }));

			expect(createdUser().name).to.equal('Jane Doe');
		});

		it('should create the user with no username when the IdP sends none', async () => {
			await SAML.insertOrUpdateSAMLUser(buildUserObject({ username: undefined }));

			expect(createdUser()).to.not.have.property('username');
		});
	});

	describe('identity of an existing user', () => {
		beforeEach(() => {
			users = [{ _id: 'existing', username: 'jane.doe', name: 'Old Name', emails: [{ address: 'jane.doe@company.com' }] }];
		});

		it('should leave the identity alone when nothing changed', async () => {
			SAMLUtils.globalSettings.nameOverwrite = true;
			users[0].name = 'Jane Doe';

			await SAML.insertOrUpdateSAMLUser(buildUserObject());

			expect(saveUserIdentity.called).to.be.false;
		});

		it('should change the username and keep the name when name overwriting is off', async () => {
			await SAML.insertOrUpdateSAMLUser(buildUserObject({ username: 'jane.smith' }));

			expect(saveUserIdentity.calledOnceWith({ _id: 'existing', name: 'Old Name', username: 'jane.smith' })).to.be.true;
		});

		it('should not change the name when name overwriting is off', async () => {
			await SAML.insertOrUpdateSAMLUser(buildUserObject());

			expect(saveUserIdentity.called).to.be.false;
		});

		it('should change the name when name overwriting is on', async () => {
			SAMLUtils.globalSettings.nameOverwrite = true;

			await SAML.insertOrUpdateSAMLUser(buildUserObject());

			expect(saveUserIdentity.calledOnceWith({ _id: 'existing', name: 'Jane Doe', username: 'jane.doe' })).to.be.true;
		});

		it('should keep the name when overwriting is on and the IdP sends no name', async () => {
			SAMLUtils.globalSettings.nameOverwrite = true;

			await SAML.insertOrUpdateSAMLUser(buildUserObject({ fullName: null }));

			expect(saveUserIdentity.called).to.be.false;
		});
	});

	describe('email of an existing user', () => {
		const newEmail = { emailList: ['new@company.com'] };

		beforeEach(() => {
			SAMLUtils.globalSettings.mailOverwrite = true;
		});

		it('should replace the email of a user linked by the custom identifier', async () => {
			users = [{ _id: 'linked', services: { saml: { employeeId: 'E-1' } } }];

			await SAML.insertOrUpdateSAMLUser(buildUserObject({ ...newEmail, ...customIdentifier('E-1') }));

			expect(updatedFields().emails.map(({ address }: { address: string }) => address)).to.deep.equal(['new@company.com']);
		});

		it('should replace the email when the username is what identifies the user', async () => {
			SAMLUtils.globalSettings.immutableProperty = 'Username';
			users = [{ _id: 'existing', username: 'jane.doe' }];

			await SAML.insertOrUpdateSAMLUser(buildUserObject(newEmail));

			expect(updatedFields().emails.map(({ address }: { address: string }) => address)).to.deep.equal(['new@company.com']);
		});

		it('should keep the email when the email is what identifies the user', async () => {
			users = [{ _id: 'existing', emails: [{ address: 'new@company.com' }] }];

			await SAML.insertOrUpdateSAMLUser(buildUserObject(newEmail));

			expect(updatedFields()).to.not.have.property('emails');
		});

		it('should keep the email when overwriting is off', async () => {
			SAMLUtils.globalSettings.mailOverwrite = false;
			SAMLUtils.globalSettings.immutableProperty = 'Username';
			users = [{ _id: 'existing', username: 'jane.doe' }];

			await SAML.insertOrUpdateSAMLUser(buildUserObject(newEmail));

			expect(updatedFields()).to.not.have.property('emails');
		});
	});

	describe('channels from the IdP', () => {
		const privateRoom = { _id: 'private-room' };
		const publicRoom = { _id: 'public-room' };

		it('should not add a new user to a private room unless private rooms are allowed', async () => {
			findRoomByNameAndType.withArgs('finance', 'p').resolves(privateRoom);

			await SAML.insertOrUpdateSAMLUser(buildUserObject({ channels: ['finance'] }));

			expect(addUserToRoom.called).to.be.false;
			expect(createRoom.called).to.be.false;
		});

		it('should skip a blank channel name', async () => {
			await SAML.insertOrUpdateSAMLUser(buildUserObject({ channels: [' '] }));

			expect(createRoom.called).to.be.false;
		});

		it('should add a new user to a room once when channel updates are on', async () => {
			SAMLUtils.globalSettings.channelsAttributeUpdate = true;
			findRoomByNameAndType.withArgs('general', 'c').resolves(publicRoom);

			await SAML.insertOrUpdateSAMLUser(buildUserObject({ channels: ['general'] }));

			expect(addUserToRoom.calledOnce).to.be.true;
		});

		it('should add a new user to a private room when private rooms are allowed', async () => {
			SAMLUtils.globalSettings.includePrivateChannelsInUpdate = true;
			findRoomByNameAndType.withArgs('finance', 'p').resolves(privateRoom);

			await SAML.insertOrUpdateSAMLUser(buildUserObject({ channels: ['finance'] }));

			expect(addUserToRoom.firstCall.args[0]).to.equal('private-room');
		});

		it('should add a new user to a public room', async () => {
			findRoomByNameAndType.withArgs('general', 'c').resolves(publicRoom);

			await SAML.insertOrUpdateSAMLUser(buildUserObject({ channels: [' general '] }));

			expect(addUserToRoom.firstCall.args[0]).to.equal('public-room');
		});

		it('should create a public room that does not exist', async () => {
			await SAML.insertOrUpdateSAMLUser(buildUserObject({ channels: ['new-team'] }));

			expect(createRoom.firstCall.args.slice(0, 2)).to.deep.equal(['c', 'new-team']);
		});

		it('should not create a room for a user with no username yet', async () => {
			await SAML.insertOrUpdateSAMLUser(buildUserObject({ channels: ['new-team'], username: undefined }));

			expect(createRoom.called).to.be.false;
		});

		it('should still log the user in when a room cannot be joined', async () => {
			findRoomByNameAndType.withArgs('general', 'c').resolves(publicRoom);
			addUserToRoom.rejects(new Error('Room is full'));

			const { userId } = await SAML.insertOrUpdateSAMLUser(buildUserObject({ channels: ['general'] }));

			expect(userId).to.equal(NEW_USER_ID);
		});

		it('should not change the rooms of an existing user unless channel updates are on', async () => {
			findRoomByNameAndType.withArgs('general', 'c').resolves(publicRoom);
			users = [{ _id: 'existing', username: 'jane.doe', emails: [{ address: 'jane.doe@company.com' }] }];

			await SAML.insertOrUpdateSAMLUser(buildUserObject({ channels: ['general'] }));

			expect(addUserToRoom.called).to.be.false;
		});

		it('should update the rooms of an existing user when channel updates are on', async () => {
			SAMLUtils.globalSettings.channelsAttributeUpdate = true;
			findRoomByNameAndType.withArgs('general', 'c').resolves(publicRoom);
			users = [{ _id: 'existing', username: 'jane.doe', emails: [{ address: 'jane.doe@company.com' }] }];

			await SAML.insertOrUpdateSAMLUser(buildUserObject({ channels: ['general'] }));

			expect(addUserToRoom.calledOnce).to.be.true;
		});
	});
});
