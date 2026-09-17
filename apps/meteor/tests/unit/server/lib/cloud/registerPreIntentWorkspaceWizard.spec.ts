import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const hasOfflineLicenseStub = sinon.stub();
const getOldestStub = sinon.stub();
const fetchStub = sinon.stub();
const buildRegistrationDataStub = sinon.stub();

const { registerPreIntentWorkspaceWizard } = proxyquire
	.noCallThru()
	.load('../../../../../server/lib/cloud/registerPreIntentWorkspaceWizard.ts', {
		'@rocket.chat/license': { License: { hasOfflineLicense: hasOfflineLicenseStub } },
		'@rocket.chat/models': { Users: { getOldest: getOldestStub } },
		'@rocket.chat/server-fetch': { serverFetch: fetchStub },
		'./buildRegistrationData': { buildWorkspaceRegistrationData: buildRegistrationDataStub },
		'../../settings': { settings: { get: sinon.stub().returns('https://cloud.rocket.chat') } },
		'../logger/system': { SystemLogger: { error: sinon.stub() } },
	});

describe('registerPreIntentWorkspaceWizard', () => {
	beforeEach(() => {
		hasOfflineLicenseStub.reset();
		getOldestStub.reset();
		fetchStub.reset();
		buildRegistrationDataStub.reset();
	});

	it('should return false without querying users or fetching when the license is offline', async () => {
		hasOfflineLicenseStub.returns(true);

		const result = await registerPreIntentWorkspaceWizard();

		expect(result).to.be.false;
		expect(getOldestStub.called).to.be.false;
		expect(fetchStub.called).to.be.false;
	});

	it('should not fetch when an offline license is applied while registration data is being built', async () => {
		// entry check passes, dispatch-time re-check catches the license change mid-flight
		hasOfflineLicenseStub.onFirstCall().returns(false);
		hasOfflineLicenseStub.onSecondCall().returns(true);
		getOldestStub.resolves({ emails: [{ address: 'admin@example.com' }] });
		buildRegistrationDataStub.resolves({});

		const result = await registerPreIntentWorkspaceWizard();

		expect(result).to.be.false;
		expect(fetchStub.called).to.be.false;
	});

	it('should contact the cloud when the license is not offline', async () => {
		hasOfflineLicenseStub.returns(false);
		getOldestStub.resolves({ emails: [{ address: 'admin@example.com' }] });
		buildRegistrationDataStub.resolves({});
		fetchStub.resolves({ ok: true });

		const result = await registerPreIntentWorkspaceWizard();

		expect(result).to.be.true;
		expect(fetchStub.calledOnce).to.be.true;
	});
});
