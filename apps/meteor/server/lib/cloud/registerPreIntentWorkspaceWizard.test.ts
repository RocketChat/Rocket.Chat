import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const hasOfflineLicenseStub = sinon.stub();
const getOldestStub = sinon.stub();
const fetchStub = sinon.stub();
const buildRegistrationDataStub = sinon.stub();

let registerPreIntentWorkspaceWizard: typeof import('./registerPreIntentWorkspaceWizard').registerPreIntentWorkspaceWizard;

before(async () => {
	const moduleMocks = [
		mock.module('@rocket.chat/license', { exports: { License: { hasOfflineLicense: hasOfflineLicenseStub } } }),
		mock.module('@rocket.chat/server-fetch', { exports: { serverFetch: fetchStub } }),
		mock.module('./buildRegistrationData', { exports: { buildWorkspaceRegistrationData: buildRegistrationDataStub } }),
		mock.module('../../settings', { exports: { settings: { get: sinon.stub().returns('https://cloud.rocket.chat') } } }),
		mock.module('../logger/system', { exports: { SystemLogger: { error: sinon.stub() } } }),
	];
	({ registerPreIntentWorkspaceWizard } = await import('./registerPreIntentWorkspaceWizard'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

describe('registerPreIntentWorkspaceWizard', () => {
	before(() => {
		mockModel('Users', { getOldest: getOldestStub });
	});

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
