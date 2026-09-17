import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const hasOfflineLicenseStub = sinon.stub();
const serverFetchStub = sinon.stub();

class CloudOfflineLicenseError extends Error {}

const { MarketplaceAPIClient } = proxyquire.noCallThru().load('../../../../../../ee/server/apps/marketplace/MarketplaceAPIClient.ts', {
	'@rocket.chat/license': { License: { hasOfflineLicense: hasOfflineLicenseStub } },
	'@rocket.chat/server-fetch': { serverFetch: serverFetchStub, Response: class {} },
	'./isTesting': { isTesting: () => false },
	'../../../../lib/errors/CloudOfflineLicenseError': { CloudOfflineLicenseError },
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
