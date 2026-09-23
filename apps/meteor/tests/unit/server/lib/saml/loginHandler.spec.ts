import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

class MeteorErrorMock extends Error {
	constructor(
		public error: unknown,
		public reason?: string,
	) {
		super(typeof reason === 'string' ? reason : String(error));
	}
}

const retrieveCredential = sinon.stub().resolves(undefined);
const insertOrUpdateSAMLUser = sinon.stub().resolves({ userId: 'user-id', token: 'login-token' });
const getUserForCheck = sinon.stub().resolves({ _id: 'user-id', services: {} });
const doesUserRequire2FA = sinon.stub().returns(false);
const removeById = sinon.stub().resolves();
const samlUtilsMock = {
	serviceProviders: [{ provider: 'test-saml' }] as any[],
	log: sinon.stub(),
	mapProfileToUserObject: sinon.stub().returns({ username: 'user' }),
	events: { emit: sinon.stub() },
};

const handler = sinon.stub();
proxyquire.noCallThru().load('../../../../../server/lib/saml/loginHandler', {
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
		Meteor: { Error: MeteorErrorMock },
	},
	'./lib/SAML': {
		SAML: { retrieveCredential, insertOrUpdateSAMLUser },
	},
	'./lib/Utils': {
		SAMLUtils: samlUtilsMock,
	},
	'../2fa/code': { getUserForCheck },
	'../oauth/twoFactorAuth': { doesUserRequire2FA },
	'../i18n': { i18n: { t: sinon.stub().returns('') } },
	'../logger/system': { SystemLogger: { error: sinon.stub() } },
});

describe('SAML loginHandler', () => {
	beforeEach(() => {
		retrieveCredential.reset();
		retrieveCredential.resolves({ profile: { email: 'user@example.com' } });
		insertOrUpdateSAMLUser.reset();
		insertOrUpdateSAMLUser.resolves({ userId: 'user-id', token: 'login-token' });
		removeById.reset();
		removeById.resolves();
		getUserForCheck.reset();
		getUserForCheck.resolves({ _id: 'user-id', services: {} });
		doesUserRequire2FA.reset();
		doesUserRequire2FA.returns(false);
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

	it('should discard the credential when no second factor is required', async () => {
		const result = await handler({ saml: true, credentialToken: 'token' });

		expect(result).to.deep.equal({ userId: 'user-id', token: 'login-token' });
		expect(removeById.calledOnceWith('token')).to.be.true;
	});

	it('should keep the credential alive when a second factor is required', async () => {
		doesUserRequire2FA.returns({ method: 'totp' });

		const result = await handler({ saml: true, credentialToken: 'token' });

		expect(result).to.deep.equal({ userId: 'user-id', token: 'login-token' });
		expect(removeById.called).to.be.false;
	});

	it('should remove the credential when provisioning the user fails', async () => {
		insertOrUpdateSAMLUser.rejects(new Error('error-invalid-user'));
		await handler({ saml: true, credentialToken: 'token' });

		expect(removeById.called).to.be.true;
	});
});
