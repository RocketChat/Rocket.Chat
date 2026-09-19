import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const retrieveCredential = sinon.stub().resolves(null);
const setExpiresAtById = sinon.stub().resolves();
const samlUtilsMock = {
	serviceProviders: [{ provider: 'test-saml' }] as any[],
	log: sinon.stub(),
	mapProfileToUserObject: sinon.stub().returns({ username: 'saml-user' }),
	events: { emit: sinon.stub() },
};
const insertOrUpdateSAMLUser = sinon.stub().resolves({ userId: 'user-id', token: 'auth-token' });

const handler = sinon.stub();
proxyquire.noCallThru().load('../../../../../server/lib/saml/loginHandler', {
	'@rocket.chat/models': {
		CredentialTokens: { setExpiresAtById },
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
		SAML: { retrieveCredential, insertOrUpdateSAMLUser },
	},
	'./lib/Utils': {
		SAMLUtils: samlUtilsMock,
	},
	'../i18n': { i18n: { t: sinon.stub().returns('') } },
	'../logger/system': { SystemLogger: { error: sinon.stub() } },
});

describe('SAML loginHandler', () => {
	beforeEach(() => {
		retrieveCredential.reset();
		retrieveCredential.resolves(null);
		setExpiresAtById.reset();
		setExpiresAtById.resolves();
		samlUtilsMock.serviceProviders = [{ provider: 'test-saml' }];
		samlUtilsMock.mapProfileToUserObject.reset();
		samlUtilsMock.mapProfileToUserObject.returns({ username: 'saml-user' });
		samlUtilsMock.events.emit.reset();
		insertOrUpdateSAMLUser.reset();
		insertOrUpdateSAMLUser.resolves({ userId: 'user-id', token: 'auth-token' });
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

	it('should not extend the credential token when no login attempt is found', async () => {
		await handler({ saml: true, credentialToken: 'missing-token' });

		expect(setExpiresAtById.called).to.be.false;
	});

	it('should extend the credential token expiration after retrieval so TOTP retries can reuse it', async () => {
		retrieveCredential.resolves({ profile: { email: 'user@example.com' } });

		await handler({ saml: true, credentialToken: 'token-to-extend' });

		expect(setExpiresAtById.calledOnce).to.be.true;
		expect(setExpiresAtById.firstCall.args[0]).to.be.equal('token-to-extend');
		expect(setExpiresAtById.firstCall.args[1]).to.be.instanceOf(Date);
	});
});
