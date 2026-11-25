import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const retrieveCredential = sinon.stub().resolves(undefined);
const insertOrUpdateSAMLUser = sinon.stub().resolves({ userId: 'user-id' });
const getUserForCheck = sinon.stub().resolves({ _id: 'user-id', services: {} });
const doesUserRequire2FA = sinon.stub().returns(false);
const removeById = sinon.stub().resolves();
const samlUtilsMock = {
	serviceProviders: [{ provider: 'test-saml' }] as any[],
	log: sinon.stub(),
	mapProfileToUserObject: sinon.stub().returns({ username: 'user' }),
	events: { emit: sinon.stub() },
};

const hasModule = sinon.stub().returns(true);

const handler = sinon.stub();
before(async () => {
	mock.module('@rocket.chat/license', {
		exports: {
			License: { hasModule },
		},
	});
	mock.module(require.resolve('meteor/accounts-base'), {
		exports: {
			Accounts: {
				LoginCancelledError: { numericError: 403 },
				registerLoginHandler: (_name: string, fn: any) => {
					handler.callsFake(fn);
				},
			},
		},
	});
	mock.module('./lib/SAML', {
		exports: {
			SAML: { retrieveCredential, insertOrUpdateSAMLUser },
		},
	});
	mock.module('./lib/Utils', {
		exports: {
			SAMLUtils: samlUtilsMock,
		},
	});
	mock.module('../../../../server/lib/2fa/code', { exports: { getUserForCheck } });
	mock.module('../../../../server/lib/oauth/twoFactorAuth', { exports: { doesUserRequire2FA } });
	mock.module('../../../../server/lib/i18n', { exports: { i18n: { t: sinon.stub().returns('') } } });
	mock.module('../../../../server/lib/logger/system', { exports: { SystemLogger: { error: sinon.stub() } } });
	await import('./loginHandler');
});

describe('SAML loginHandler', () => {
	before(() => {
		mockModel('CredentialTokens', { removeById });
	});

	beforeEach(() => {
		retrieveCredential.reset();
		retrieveCredential.resolves({ profile: { email: 'user@example.com' } });
		insertOrUpdateSAMLUser.reset();
		insertOrUpdateSAMLUser.resolves({ userId: 'user-id' });
		removeById.reset();
		removeById.resolves();
		getUserForCheck.reset();
		getUserForCheck.resolves({ _id: 'user-id', services: {} });
		doesUserRequire2FA.reset();
		doesUserRequire2FA.returns(false);
		samlUtilsMock.serviceProviders = [{ provider: 'test-saml' }];
		hasModule.reset();
		hasModule.returns(true);
	});

	it('should return undefined without the saml-enterprise module', async () => {
		hasModule.withArgs('saml-enterprise').returns(false);

		expect(await handler({ saml: true, credentialToken: 'token' })).to.be.undefined;
		expect(retrieveCredential.called).to.be.false;
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

		expect(result).to.deep.equal({ userId: 'user-id' });
		expect(removeById.calledOnceWith('token')).to.be.true;
	});

	it('should keep the credential alive when a second factor is required', async () => {
		doesUserRequire2FA.returns({ method: 'totp' });

		const result = await handler({ saml: true, credentialToken: 'token' });

		expect(result).to.deep.equal({ userId: 'user-id' });
		expect(removeById.called).to.be.false;
	});

	it('should remove the credential when provisioning the user fails', async () => {
		insertOrUpdateSAMLUser.rejects(new Error('error-invalid-user'));
		await handler({ saml: true, credentialToken: 'token' });

		expect(removeById.called).to.be.true;
	});
});
