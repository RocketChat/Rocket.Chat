import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	Users: {
		getActiveLocalUserCount: sinon.stub(),
		findOneByUsernameIgnoringCase: sinon.stub(),
		findLDAPUsers: sinon.stub(),
		findLDAPUsersExceptIds: sinon.stub(),
		findConnectedLDAPUsers: sinon.stub(),
		unsetLoginTokens: sinon.stub(),
	},
	Roles: {
		find: sinon.stub(),
	},
	Subscriptions: {
		findOneByRoomIdAndUserId: sinon.stub(),
	},
	Rooms: {
		findOneByNonValidatedName: sinon.stub(),
	},
};

const licenseMock = {
	getMaxActiveUsers: sinon.stub(),
};

const LDAPUserConverter = {
	addObjectToMemory: sinon.stub(),
};

const { LDAPEEManager } = proxyquire.noCallThru().load('./Manager', {
	'../../../../app/importer/server/definitions/IConversionCallbacks': {
		ImporterAfterImportCallback: sinon.stub(),
		ImporterBeforeImportCallback: sinon.stub(),
	},
	'../../../../app/lib/server/functions/addUserToRoom': {
		addUserToRoom: sinon.stub(),
	},
	'../../../../app/lib/server/functions/createRoom': {
		createRoom: sinon.stub(),
	},
	'../../../../app/lib/server/functions/removeUserFromRoom': {
		removeUserFromRoom: sinon.stub(),
	},
	'../../../../app/lib/server/functions/setUserActiveStatus': {
		setUserActiveStatus: sinon.stub(),
	},
	'../../../../app/settings/server': {
		settings: sinon.stub(),
	},
	'../../../../app/utils/server/lib/getValidRoomName': {
		getValidRoomName: sinon.stub(),
	},
	'../../../../lib/utils/arrayUtils': {
		ensureArray: sinon.stub(),
	},
	'../../../../server/lib/ldap/Connection': {
		LDAPConnection: sinon.stub(),
	},
	'../../../../server/lib/ldap/Logger': {
		logger: sinon.stub(),
		searchLogger: sinon.stub(),
		mapLogger: sinon.stub(),
	},
	'../../../../server/lib/ldap/Manager': {
		LDAPManager: sinon.stub(),
	},
	'../../../../server/lib/ldap/UserConverter': {
		LDAPUserConverter,
	},
	'../syncUserRoles': {
		syncUserRoles: sinon.stub(),
	},
	'./copyCustomFieldsLDAP': {
		copyCustomFieldsLDAP: sinon.stub(),
	},
	'@rocket.chat/models': { ...modelsMock, '@global': true },
	'@rocket.chat/license': { ...licenseMock, '@global': true },
	'@rocket.chat/core-services': { Team: sinon.stub() },
	'@rocket.chat/core-typings': {
		...sinon.stub(),
	},
	'ldapjs': {
		createClient: sinon.stub(),
	},
});

describe('willExceedLicenseLimit', () => {
	it('should return false if the number of active users is less than the maximum allowed', async () => {
		const activeUsers = 10;
		const usersInserted = 10;
		const maxUsersAllowed = 40;

		expect(await LDAPEEManager.willExceedLicenseLimit(activeUsers, usersInserted, maxUsersAllowed)).to.be.false;
	});

	it('should return true if the number of active users is greater than the maximum allowed', async () => {
		const activeUsers = 35;
		const usersInserted = 10;
		const maxUsersAllowed = 40;

		expect(await LDAPEEManager.willExceedLicenseLimit(activeUsers, usersInserted, maxUsersAllowed)).to.be.true;
	});

	it('should return true if the number of active users is equal to the maximum allowed', async () => {
		const activeUsers = 40;
		const usersInserted = 0;
		const maxUsersAllowed = 40;

		expect(await LDAPEEManager.willExceedLicenseLimit(activeUsers, usersInserted, maxUsersAllowed)).to.be.true;
	});
});
