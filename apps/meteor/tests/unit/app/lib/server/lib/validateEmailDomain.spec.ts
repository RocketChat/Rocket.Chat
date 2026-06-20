import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

class MeteorError extends Error {
	error: string;

	reason?: string;

	details?: unknown;

	constructor(error: string, reason?: string, details?: unknown) {
		super(reason ?? error);
		this.error = error;
		this.reason = reason;
		this.details = details;
	}
}

describe('validateEmailDomain', () => {
	const getStub = sinon.stub();
	const watchCallbacks: Record<string, (value?: string) => void> = {};
	const watchStub = sinon.stub().callsFake((setting: string, callback: (value?: string) => void) => {
		watchCallbacks[setting] = callback;
	});

	const { validateEmailDomain } = proxyquire.noCallThru().load('../../../../../../app/lib/server/lib/validateEmailDomain', {
		'../../../settings/server': { settings: { watch: watchStub, get: getStub } },
		'meteor/meteor': { Meteor: { Error: MeteorError } },
	});

	const setAllowedDomains = (value?: string) => watchCallbacks.Accounts_AllowedDomainsList(value);
	const setBlockedDomains = (value?: string) => watchCallbacks.Accounts_BlockedDomainsList(value);

	beforeEach(() => {
		getStub.reset();
		// Default every setting to off: no DNS check and no default blocklist.
		getStub.returns(false);
		// Reset the in-memory allow/deny lists between tests.
		setAllowedDomains(undefined);
		setBlockedDomains(undefined);
	});

	afterEach(() => {
		sinon.restore();
	});

	const expectRejectedWith = async (email: string, expectedError: string) => {
		let error: MeteorError | undefined;
		try {
			await validateEmailDomain(email);
		} catch (e) {
			error = e as MeteorError;
		}
		expect(error, `expected "${email}" to be rejected`).to.be.instanceOf(MeteorError);
		expect(error?.error).to.equal(expectedError);
	};

	describe('allowed domains list', () => {
		beforeEach(() => {
			setAllowedDomains('gmail.com');
		});

		it('should accept an email whose domain matches the allowed list in a different case', async () => {
			expect(await validateEmailDomain('user@GMAIL.com')).to.be.undefined;
		});

		it('should accept an email whose domain matches the allowed list exactly', async () => {
			expect(await validateEmailDomain('user@gmail.com')).to.be.undefined;
		});

		it('should reject an email whose domain is not in the allowed list, regardless of case', async () => {
			await expectRejectedWith('user@Yahoo.com', 'error-invalid-domain');
		});

		it('should match case-insensitively even when the configured list value is mixed-case', async () => {
			setAllowedDomains('GMail.COM');
			expect(await validateEmailDomain('user@gmail.com')).to.be.undefined;
		});
	});

	describe('blocked domains list', () => {
		it('should block an email whose domain matches the blocked list in a different case', async () => {
			setBlockedDomains('spam.com');
			await expectRejectedWith('user@SPAM.com', 'error-email-domain-blacklisted');
		});

		it('should block against the default blocked domains list case-insensitively', async () => {
			getStub.withArgs('Accounts_UseDefaultBlockedDomainsList').returns(true);
			// A non-empty custom blocked list is required for the default list to be consulted.
			setBlockedDomains('not-a-default-domain.test');
			await expectRejectedWith('user@MAILINATOR.com', 'error-email-domain-blacklisted');
		});
	});
});
