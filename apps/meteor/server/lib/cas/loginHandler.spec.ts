import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const removeNotExpiredById = sinon.stub().resolves(null);
const findExistingCASUser = sinon.stub().resolves(null);
const settingsGet = sinon.stub().returns(true);

const { loginHandlerCAS: handler } = proxyquire.noCallThru().load('./loginHandler', {
	'@rocket.chat/models': {
		CredentialTokens: { removeNotExpiredById },
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
	'../users/setRealName': { setRealName: sinon.stub().resolves() },
	'../../../app/settings/server': { settings: { get: settingsGet } },
});

describe('loginHandlerCAS', () => {
	beforeEach(() => {
		removeNotExpiredById.reset();
		removeNotExpiredById.resolves(null);
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

		expect(removeNotExpiredById.called).to.be.false;
	});

	it('should consume the credential token and reject when no matching login attempt is found', async () => {
		await expect(handler({ cas: { credentialToken: 'valid-token' } })).to.be.rejected;
		expect(removeNotExpiredById.calledOnceWith('valid-token')).to.be.true;
	});

	it('should return undefined when CAS is disabled', async () => {
		settingsGet.returns(false);

		expect(await handler({ cas: { credentialToken: 'valid-token' } })).to.be.undefined;
		expect(removeNotExpiredById.called).to.be.false;
	});
});
