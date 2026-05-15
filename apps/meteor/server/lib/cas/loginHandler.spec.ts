import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const findOneNotExpiredById = sinon.stub().resolves(null);
const removeById = sinon.stub().resolves();
const findExistingCASUser = sinon.stub().resolves(null);
const settingsGet = sinon.stub().returns(true);

const { loginHandlerCAS: handler } = proxyquire.noCallThru().load('./loginHandler', {
	'@rocket.chat/models': {
		CredentialTokens: { findOneNotExpiredById, removeById },
		Users: { updateOne: sinon.stub().resolves() },
	},
	'meteor/accounts-base': {
		Accounts: {
			LoginCancelledError: { numericError: 403 },
		},
	},
	'meteor/meteor': {
		Meteor: { Error },
	},
	'./createNewUser': { createNewUser: sinon.stub().resolves({ _id: 'newUserId' }) },
	'./findExistingCASUser': { findExistingCASUser },
	'./logger': { logger: { debug: sinon.stub(), error: sinon.stub() } },
	'../../../app/lib/server/functions/setRealName': { setRealName: sinon.stub().resolves() },
	'../../../app/settings/server': { settings: { get: settingsGet } },
});

describe('loginHandlerCAS', () => {
	beforeEach(() => {
		findOneNotExpiredById.reset();
		removeById.reset();
		findExistingCASUser.reset();
		settingsGet.reset();
		settingsGet.returns(true);
	});

	it('should reject non-string credentialToken and never query the database (NoSQL injection prevention)', async () => {
		expect(await handler({ cas: { credentialToken: { $gt: '' } } })).to.be.undefined;
		expect(await handler({ cas: { credentialToken: { $ne: null } } })).to.be.undefined;
		expect(await handler({ cas: { credentialToken: 123 } })).to.be.undefined;
		expect(await handler({ cas: { credentialToken: ['a'] } })).to.be.undefined;
		expect(await handler({ cas: { credentialToken: null } })).to.be.undefined;

		expect(findOneNotExpiredById.called).to.be.false;
	});

	it('should return undefined when CAS is disabled', async () => {
		settingsGet.returns(false);

		expect(await handler({ cas: { credentialToken: 'valid-token' } })).to.be.undefined;
		expect(findOneNotExpiredById.called).to.be.false;
	});
});
