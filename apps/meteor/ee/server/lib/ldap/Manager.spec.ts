import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsStub = { get: sinon.stub() };
const roomsStub = { findOneByNonValidatedName: sinon.stub() };
const subscriptionsStub = { findOneByRoomIdAndUserId: sinon.stub() };
const addUserToRoomStub = sinon.stub();
const removeUserFromRoomStub = sinon.stub();
const loggerStub = { debug: sinon.stub(), error: sinon.stub(), info: sinon.stub(), warn: sinon.stub() };

const { LDAPEEManager } = proxyquire.noCallThru().load('./Manager', {
	'@rocket.chat/core-services': { Abac: {}, Team: {} },
	'@rocket.chat/license': { License: { hasModule: () => false } },
	'@rocket.chat/models': { Users: {}, Roles: {}, Subscriptions: subscriptionsStub, Rooms: roomsStub },
	'../../../../app/importer/server/definitions/IConversionCallbacks': {},
	'../../../../app/lib/server/functions/addUserToRoom': { addUserToRoom: addUserToRoomStub },
	'../../../../app/lib/server/functions/createRoom': { createRoom: sinon.stub() },
	'../../../../app/lib/server/functions/removeUserFromRoom': { removeUserFromRoom: removeUserFromRoomStub },
	'../../../../app/lib/server/functions/setUserActiveStatus': { setUserActiveStatus: sinon.stub() },
	'../../../../app/settings/server': { settings: settingsStub },
	'../../../../app/utils/server/lib/getValidRoomName': { getValidRoomName: (name: string) => Promise.resolve(name) },
	'../../../../lib/utils/arrayUtils': { ensureArray: (value: unknown) => (Array.isArray(value) ? value : [value]) },
	'../../../../server/lib/ldap/Connection': { LDAPConnection: class {} },
	'../../../../server/lib/ldap/Logger': { logger: loggerStub, searchLogger: loggerStub, mapLogger: loggerStub },
	'../../../../server/lib/ldap/Manager': { LDAPManager: class {} },
	'../../../../server/lib/ldap/UserConverter': { LDAPUserConverter: class {} },
	'../syncUserRoles': { syncUserRoles: sinon.stub() },
	'./copyCustomFieldsLDAP': { copyCustomFieldsLDAP: sinon.stub() },
});

const user = { _id: 'userId', username: 'john' };

const channelsMap = {
	groupA: 'channel-a',
	deadGroup: 'missing-channel',
	groupB: 'channel-b',
};

const setupSettings = (map: Record<string, string>) => {
	settingsStub.get.reset();
	settingsStub.get.withArgs('LDAP_Sync_User_Data_Channels').returns(true);
	settingsStub.get.withArgs('LDAP_Sync_User_Data_Channels_Enforce_AutoChannels').returns(true);
	settingsStub.get.withArgs('LDAP_Sync_User_Data_ChannelsMap').returns(JSON.stringify(map));
	settingsStub.get.withArgs('LDAP_Sync_User_Data_Channels_Filter').returns('');
	settingsStub.get.withArgs('LDAP_Sync_User_Data_Channels_BaseDN').returns('');
	settingsStub.get.withArgs('LDAP_Sync_User_Data_Channels_GroupMembershipValidationStrategy').returns('once');
	settingsStub.get.withArgs('ABAC_Enabled').returns(false);
};

const syncUserChannels = (ldapUserGroups: string[]) => {
	const groupsStub = sinon.stub(LDAPEEManager as any, 'getLdapGroupsByUsername').resolves(ldapUserGroups);
	return (LDAPEEManager as any).syncUserChannels({}, user, 'dn').finally(() => groupsStub.restore());
};

describe('LDAPEEManager syncUserChannels', () => {
	beforeEach(() => {
		roomsStub.findOneByNonValidatedName.reset();
		subscriptionsStub.findOneByRoomIdAndUserId.reset();
		addUserToRoomStub.reset();
		removeUserFromRoomStub.reset();
		setupSettings(channelsMap);

		roomsStub.findOneByNonValidatedName.withArgs('channel-a').resolves({ _id: 'ridA' });
		roomsStub.findOneByNonValidatedName.withArgs('channel-b').resolves({ _id: 'ridB' });
		roomsStub.findOneByNonValidatedName.withArgs('missing-channel').resolves(null);
		subscriptionsStub.findOneByRoomIdAndUserId.resolves({ _id: 'subId' });
	});

	it('should remove the user from remaining channels when an earlier mapped channel cannot be resolved', async () => {
		await syncUserChannels(['groupA']);

		expect(addUserToRoomStub.calledWith('ridA', user)).to.be.true;
		expect(removeUserFromRoomStub.calledWith('ridB', user)).to.be.true;
	});

	it('should skip Team channels on removal without aborting the rest of the pass', async () => {
		roomsStub.findOneByNonValidatedName.withArgs('missing-channel').resolves({ _id: 'ridTeam', teamMain: true });

		await syncUserChannels(['groupA']);

		expect(removeUserFromRoomStub.calledWith('ridTeam', user)).to.be.false;
		expect(removeUserFromRoomStub.calledWith('ridB', user)).to.be.true;
	});

	it('should keep adding and removing channels when an unresolved channel fails to be created on the add pass', async () => {
		sinon.stub(LDAPEEManager as any, 'createRoomForSync').resolves(undefined);

		try {
			await syncUserChannels(['deadGroup', 'groupA']);
		} finally {
			((LDAPEEManager as any).createRoomForSync as sinon.SinonStub).restore();
		}

		expect(addUserToRoomStub.calledWith('ridA', user)).to.be.true;
		expect(removeUserFromRoomStub.calledWith('ridB', user)).to.be.true;
	});
});
