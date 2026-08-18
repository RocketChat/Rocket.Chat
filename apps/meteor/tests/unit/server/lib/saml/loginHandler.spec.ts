import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const retrieveCredential = sinon.stub().resolves(null);
const insertOrUpdateSAMLUser = sinon.stub().resolves({ userId: 'some-user-id', token: 'some-token' });
const removeById = sinon.stub().resolves();
const warnUnlicensedAuthService = sinon.stub();
const mapProfileToUserObject = sinon.stub().returns({
	identifier: { type: 'username', attribute: 'username', value: 'some-username' },
	attributeList: new Map(),
} as any);
const samlUtilsMock = {
	serviceProviders: [{ provider: 'test-saml' }] as any[],
	log: sinon.stub(),
	mapProfileToUserObject,
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
	'../premiumAuthDeprecation': { warnUnlicensedAuthService },
});

describe('SAML loginHandler', () => {
	beforeEach(() => {
		retrieveCredential.reset();
		retrieveCredential.resolves(null);
		insertOrUpdateSAMLUser.reset();
		insertOrUpdateSAMLUser.resolves({ userId: 'some-user-id', token: 'some-token' });
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

	it('should not delete the credential token after retrieval so the mobile webview and the native app can both redeem it', async () => {
		await handler({ saml: true, credentialToken: 'token-to-keep' });

		expect(removeById.called).to.be.false;
	});

	it('should let the same credential token be redeemed more than once (mobile login flow)', async () => {
		const tokenStore = new Map<string, { profile: Record<string, any> }>();
		retrieveCredential.callsFake(async (token: string) => tokenStore.get(token));
		removeById.callsFake(async (token: string) => {
			tokenStore.delete(token);
		});
		tokenStore.set('shared-token', { profile: { username: 'mobile-user', email: 'mobile@example.com' } });

		const first = await handler({ saml: true, credentialToken: 'shared-token' });
		const second = await handler({ saml: true, credentialToken: 'shared-token' });

		expect(first).to.have.property('userId');
		expect(second).to.have.property('userId');
		expect(removeById.called).to.be.false;
	});
});
