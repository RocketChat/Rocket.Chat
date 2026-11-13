import { before, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

const hasOfflineLicenseStub = sinon.stub();
const serverFetchStub = sinon.stub();

class CloudOfflineLicenseError extends Error {}

let MarketplaceAPIClient: typeof import('./MarketplaceAPIClient').MarketplaceAPIClient;

before(async () => {
	const moduleMocks = [
		mock.module('@rocket.chat/license', { exports: { License: { hasOfflineLicense: hasOfflineLicenseStub } } }),
		mock.module('@rocket.chat/server-fetch', { exports: { serverFetch: serverFetchStub, Response: class {} } }),
		mock.module('./isTesting', { exports: { isTesting: () => false } }),
		mock.module('../../../../../lib/errors/CloudOfflineLicenseError', { exports: { CloudOfflineLicenseError } }),
	];
	({ MarketplaceAPIClient } = await import('./MarketplaceAPIClient'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

describe('MarketplaceAPIClient', () => {
	beforeEach(() => {
		hasOfflineLicenseStub.reset();
		serverFetchStub.reset();
	});

	it('should reject with CloudOfflineLicenseError and never invoke the fetch strategy when the license is offline', async () => {
		hasOfflineLicenseStub.returns(true);

		const client = new MarketplaceAPIClient();

		await expect(client.fetch('v1/apps')).to.be.rejectedWith(CloudOfflineLicenseError);
		expect(serverFetchStub.called).to.be.false;
	});

	it('should re-evaluate the license on every call, not cache the verdict on the instance', async () => {
		const client = new MarketplaceAPIClient();

		hasOfflineLicenseStub.returns(false);
		serverFetchStub.resolves({ status: 200 });
		await client.fetch('v1/apps');
		expect(serverFetchStub.calledOnce).to.be.true;

		// license flips to offline at runtime: the same instance must now reject
		hasOfflineLicenseStub.returns(true);
		await expect(client.fetch('v1/apps')).to.be.rejectedWith(CloudOfflineLicenseError);
		expect(serverFetchStub.calledOnce).to.be.true;
	});

	it('should fetch from the marketplace when the license is not offline', async () => {
		hasOfflineLicenseStub.returns(false);
		serverFetchStub.resolves({ status: 200 });

		const client = new MarketplaceAPIClient();
		await client.fetch('v1/apps');

		expect(serverFetchStub.calledOnce).to.be.true;
		expect(serverFetchStub.firstCall.args[0]).to.equal('https://marketplace.rocket.chat/v1/apps');
	});
});
