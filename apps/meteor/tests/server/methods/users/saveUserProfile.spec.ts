import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const stubs = {
	Users: {
		findOneById: sinon.stub(),
		setBio: sinon.stub(),
	},
	rcSettings: {
		get: sinon.stub(),
	},
};
const AccountsMock = { setPasswordAsync: sinon.stub() };
const checkMock = sinon.stub();
const MatchMock = { Maybe: sinon.stub() };
const MeteorMock = { call: sinon.stub(), Error: sinon.stub() };

const { saveUserProfile } = proxyquire.noCallThru().load('../../../../server/methods/saveUserProfile', {
	'meteor/accounts-base': { 'Accounts': AccountsMock, '@global': true },
	'meteor/check': { 'check': checkMock, 'Match': MatchMock, '@global': true },
	'@rocket.chat/models': { Users: stubs.Users },
	'../../../../app/settings/server': { settings: stubs.rcSettings },
	'meteor/meteor': { 'Meteor': MeteorMock, '@global': true },
});

describe('Users - saveUserProfile (Bio Update)', () => {
	beforeEach(() => {
		sinon.restore();
		stubs.rcSettings.get.withArgs('Accounts_AllowUserProfileChange').returns(true);
	});

	it('should update the bio to an empty string and call setBio', async () => {
		stubs.Users.findOneById.resolves({ _id: 'userId', bio: 'Old bio text' });
		stubs.Users.setBio.resolves(true);
		await saveUserProfile.call({ userId: 'userId' }, { bio: '' }, {});
		expect(stubs.Users.setBio.calledWith('userId', '')).to.be.true;
	});
});
