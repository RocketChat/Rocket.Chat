import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const retrieveCredential = sinon.stub().resolves(null);
const removeById = sinon.stub().resolves();
const samlUtilsMock = {
	serviceProviders: [{ provider: 'test-saml' }] as any[],
	log: sinon.stub(),
	mapProfileToUserObject: sinon.stub(),
	events: { emit: sinon.stub() },
};

const handler = sinon.stub();
proxyquire.noCallThru().load('../../../../app/meteor-accounts-saml/server/loginHandler', {
	'@rocket.chat/models': {
		CredentialTokens: { removeById },
	},
	'meteor/accounts-base': {
		Accounts: {
			LoginCancelledError: { numericError: 403 },
			registerLoginHandler: (_name: string, fn: any) => {
				handler.callsFake(fn);
			},
		},
	},
	'meteor/meteor': {
		Meteor: { Error },
	},
	'./lib/SAML': {
		SAML: { retrieveCredential },
	},
	'./lib/Utils': {
		SAMLUtils: samlUtilsMock,
	},
	'../../../server/lib/i18n': { i18n: { t: sinon.stub().returns('') } },
	'../../../server/lib/logger/system': { SystemLogger: { error: sinon.stub() } },
});

describe('SAML loginHandler', () => {
	beforeEach(() => {
		retrieveCredential.reset();
		retrieveCredential.resolves(null);
		removeById.reset();
		removeById.resolves();
		samlUtilsMock.serviceProviders = [{ provider: 'test-saml' }];
	});

	it('should reject non-string credentialToken and never query the database (NoSQL injection prevention)', async () => {
		expect(await handler({ saml: true, credentialToken: { $gt: '' } })).to.be.undefined;
		expect(await handler({ saml: true, credentialToken: { $ne: null } })).to.be.undefined;
		expect(await handler({ saml: true, credentialToken: { $not: { $eq: '__nonexistent__' } } })).to.be.undefined;
		expect(await handler({ saml: true, credentialToken: 123 })).to.be.undefined;
		expect(await handler({ saml: true, credentialToken: ['a'] })).to.be.undefined;
		expect(await handler({ saml: true, credentialToken: null })).to.be.undefined;

		expect(retrieveCredential.called).to.be.false;
	});

	it('should return undefined when no SAML providers are configured', async () => {
		samlUtilsMock.serviceProviders = [];

		expect(await handler({ saml: true, credentialToken: 'valid-token' })).to.be.undefined;
		expect(retrieveCredential.called).to.be.false;
	});

	it('should delete the credential token after retrieval', async () => {
		await handler({ saml: true, credentialToken: 'token-to-delete' });

		expect(removeById.calledOnce).to.be.true;
		expect(removeById.calledWith('token-to-delete')).to.be.true;
	});
});
