import { expect } from 'chai';
import { describe, it, beforeEach, vi } from 'vitest';

const { stubs, sandbox } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	const sandbox = sinon.createSandbox();
	return {
		sandbox,
		stubs: {
			findOneNotExpiredById: sandbox.stub().resolves(null),
			removeById: sandbox.stub().resolves(),
			usersUpdateOne: sandbox.stub().resolves(),
			findExistingCASUser: sandbox.stub().resolves(null),
			settingsGet: sandbox.stub().returns(true),
			createNewUser: sandbox.stub().resolves({ _id: 'newUserId' }),
			setRealName: sandbox.stub().resolves(),
			loggerDebug: sandbox.stub(),
			loggerError: sandbox.stub(),
		},
	};
});

vi.mock('@rocket.chat/models', () => ({
	CredentialTokens: { findOneNotExpiredById: stubs.findOneNotExpiredById, removeById: stubs.removeById },
	Users: { updateOne: stubs.usersUpdateOne },
}));
vi.mock('meteor/accounts-base', () => ({
	Accounts: {
		LoginCancelledError: { numericError: 403 },
	},
}));
vi.mock('meteor/meteor', () => ({
	Meteor: { Error },
}));
vi.mock('./createNewUser', () => ({ createNewUser: stubs.createNewUser }));
vi.mock('./findExistingCASUser', () => ({ findExistingCASUser: stubs.findExistingCASUser }));
vi.mock('./logger', () => ({ logger: { debug: stubs.loggerDebug, error: stubs.loggerError } }));
vi.mock('../../../app/lib/server/functions/setRealName', () => ({ setRealName: stubs.setRealName }));
vi.mock('../../../app/settings/server', () => ({ settings: { get: stubs.settingsGet } }));

const { loginHandlerCAS: handler } = await import('./loginHandler');

describe('loginHandlerCAS', () => {
	beforeEach(() => {
		stubs.findOneNotExpiredById.reset();
		stubs.removeById.reset();
		stubs.findExistingCASUser.reset();
		stubs.settingsGet.reset();
		stubs.settingsGet.returns(true);
	});

	it('should reject non-string credentialToken and never query the database (NoSQL injection prevention)', async () => {
		expect(await handler({ cas: { credentialToken: { $gt: '' } } })).to.be.undefined;
		expect(await handler({ cas: { credentialToken: { $ne: null } } })).to.be.undefined;
		expect(await handler({ cas: { credentialToken: 123 } })).to.be.undefined;
		expect(await handler({ cas: { credentialToken: ['a'] } })).to.be.undefined;
		expect(await handler({ cas: { credentialToken: null } })).to.be.undefined;

		expect(stubs.findOneNotExpiredById.called).to.be.false;
	});

	it('should return undefined when CAS is disabled', async () => {
		stubs.settingsGet.returns(false);

		expect(await handler({ cas: { credentialToken: 'valid-token' } })).to.be.undefined;
		expect(stubs.findOneNotExpiredById.called).to.be.false;
	});
});
