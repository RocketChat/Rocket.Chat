import { expect } from 'chai';
import { describe, it, beforeEach, vi } from 'vitest';

const { retrieveCredential, removeById, samlUtilsMock, handler } = vi.hoisted(() => {
	const sinon = require('sinon');
	return {
		retrieveCredential: sinon.stub().resolves(null),
		removeById: sinon.stub().resolves(),
		samlUtilsMock: {
			serviceProviders: [{ provider: 'test-saml' }] as any[],
			log: sinon.stub(),
			mapProfileToUserObject: sinon.stub(),
			events: { emit: sinon.stub() },
		},
		handler: sinon.stub(),
	};
});

vi.mock('@rocket.chat/models', () => ({
	CredentialTokens: { removeById },
}));
vi.mock('meteor/accounts-base', () => ({
	Accounts: {
		LoginCancelledError: { numericError: 403 },
		registerLoginHandler: (_name: string, fn: any) => {
			handler.callsFake(fn);
		},
	},
}));
vi.mock('meteor/meteor', () => ({
	Meteor: { Error },
}));
vi.mock('../../../../app/meteor-accounts-saml/server/lib/SAML', () => ({
	SAML: { retrieveCredential },
}));
vi.mock('../../../../app/meteor-accounts-saml/server/lib/Utils', () => ({
	SAMLUtils: samlUtilsMock,
}));
vi.mock('../../../../server/lib/i18n', () => ({ i18n: { t: () => '' } }));
vi.mock('../../../../server/lib/logger/system', () => ({ SystemLogger: { error: () => undefined } }));

await import('../../../../app/meteor-accounts-saml/server/loginHandler');

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
