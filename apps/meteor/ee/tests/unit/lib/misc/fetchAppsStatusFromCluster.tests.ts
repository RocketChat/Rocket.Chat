import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const getInstanceListMock = sinon.stub();
const InstanceStatusMock = {
	find: sinon.stub().returns({
		toArray: sinon.stub(),
	}),
};
const fetchMock = sinon.stub();

const { fetchAppsStatusFromHighAvailability } = proxyquire.noCallThru().load('../../../../lib/misc/fetchAppsStatusFromCluster', {
	'../../../app/api/server/helpers/getInstanceList': { getInstanceList: getInstanceListMock },
	'@rocket.chat/models': { InstanceStatus: InstanceStatusMock },
	'@rocket.chat/server-fetch': { serverFetch: fetchMock },
});

describe('fetchAppsStatusFromHighAvailability', () => {
	beforeEach(() => {
		getInstanceListMock.reset();
		InstanceStatusMock.find().toArray.reset();
		fetchMock.reset();
	});

	it('should throw an error when there are not enough connections', async () => {
		getInstanceListMock.resolves([{ local: true, id: 'local1', ipList: ['127.0.0.1'] }]);

		await expect(fetchAppsStatusFromHighAvailability()).to.be.rejectedWith('Not enough connections to fetch apps status');
	});

	it('should throw an error when instance is not found', async () => {
		getInstanceListMock.resolves([
			{ local: true, id: 'remote1', ipList: ['192.168.1.1'] },
			{ local: false, id: 'remote2', ipList: ['192.168.1.2'] },
		]);

		InstanceStatusMock.find().toArray.resolves([]);

		await expect(fetchAppsStatusFromHighAvailability()).to.be.rejectedWith('Instance not found');
	});

	it('should throw error when instance has no port', async () => {
		getInstanceListMock.resolves([
			{ local: true, id: 'remote1', ipList: ['192.168.1.1'] },
			{ local: false, id: 'remote2', ipList: ['192.168.1.2'] },
		]);

		InstanceStatusMock.find().toArray.resolves([{ _id: 'remote2', extraInformation: {} }]);

		await expect(fetchAppsStatusFromHighAvailability()).to.be.rejectedWith('Instance has no port');
	});

	it('should skip local connections', async () => {
		getInstanceListMock.resolves([
			{ local: true, id: 'remote1', ipList: ['192.168.1.1'] },
			{ local: false, id: 'remote2', ipList: ['192.168.1.2'] },
		]);

		InstanceStatusMock.find().toArray.resolves([
			{ _id: 'remote1', extraInformation: { port: 3000 } },
			{ _id: 'remote2', extraInformation: { port: 3002 } },
		]);

		fetchMock
			.withArgs('http://192.168.1.2:3002/api/apps/installed')
			.resolves({
				json: () =>
					Promise.resolve({
						success: true,
						apps: [
							{ id: 'app1', status: 'enabled' },
							{ id: 'app2', status: 'disabled' },
						],
					}),
			})
			.withArgs('http://192.168.1.1:3000/api/apps/installed')
			.rejects(new Error('Should not be called'));

		const result = await fetchAppsStatusFromHighAvailability();

		expect(result).to.deep.equal({
			app1: [{ status: 'enabled', instanceId: 'remote2' }],
			app2: [{ status: 'disabled', instanceId: 'remote2' }],
		});
	});

	it('should successfully fetch apps status from multiple instances', async () => {
		getInstanceListMock.resolves([
			{ local: true, id: 'remote0', ipList: ['192.168.1.3'] },
			{ local: false, id: 'remote1', ipList: ['192.168.1.1'] },
			{ local: false, id: 'remote2', ipList: ['192.168.1.2'] },
		]);

		InstanceStatusMock.find().toArray.resolves([
			{ _id: 'remote1', extraInformation: { port: 3000 } },
			{ _id: 'remote2', extraInformation: { port: 3002 } },
		]);

		fetchMock
			.onFirstCall()
			.resolves({
				json: () =>
					Promise.resolve({
						success: true,
						apps: [
							{ id: 'app1', status: 'enabled' },
							{ id: 'app2', status: 'enabled' },
						],
					}),
			})
			.onSecondCall()
			.resolves({
				json: () =>
					Promise.resolve({
						success: true,
						apps: [
							{ id: 'app1', status: 'initialized' },
							{ id: 'app2', status: 'enabled' },
						],
					}),
			});

		const result = await fetchAppsStatusFromHighAvailability();

		expect(result).to.deep.equal({
			app1: [
				{ status: 'enabled', instanceId: 'remote1' },
				{ status: 'initialized', instanceId: 'remote2' },
			],
			app2: [
				{ status: 'enabled', instanceId: 'remote1' },
				{ status: 'enabled', instanceId: 'remote2' },
			],
		});
	});

	it('should throw error when fetch response is not successful', async () => {
		getInstanceListMock.resolves([
			{ local: true, id: 'remote1', ipList: ['192.168.1.1'] },
			{ local: false, id: 'remote2', ipList: ['192.168.1.2'] },
		]);

		InstanceStatusMock.find().toArray.resolves([{ _id: 'remote2', extraInformation: { port: 3000 } }]);

		fetchMock.resolves({
			json: () =>
				Promise.resolve({
					success: false,
					apps: [],
				}),
		});

		await expect(fetchAppsStatusFromHighAvailability()).to.be.rejectedWith('Failed to fetch apps status');
	});

	// This is a case that should never happen, as installed apps always have a status
	// However, for the sake of completeness and coverage, we should test it
	it('should throw error when app status is undefined', async () => {
		getInstanceListMock.resolves([
			{ local: true, id: 'remote1', ipList: ['192.168.1.1'] },
			{ local: false, id: 'remote2', ipList: ['192.168.1.2'] },
		]);

		InstanceStatusMock.find().toArray.resolves([{ _id: 'remote2', extraInformation: { port: 3000 } }]);

		fetchMock.resolves({
			json: () =>
				Promise.resolve({
					success: true,
					apps: [
						{ id: 'app1' }, // status is undefined
					],
				}),
		});

		await expect(fetchAppsStatusFromHighAvailability()).to.be.rejectedWith('App status is undefined');
	});

	it('should handle network errors during fetch', async () => {
		getInstanceListMock.resolves([
			{ local: true, id: 'remote1', ipList: ['192.168.1.1'] },
			{ local: false, id: 'remote2', ipList: ['192.168.1.2'] },
		]);

		InstanceStatusMock.find().toArray.resolves([{ _id: 'remote2', extraInformation: { port: 3000 } }]);

		fetchMock.rejects(new Error('Network error'));

		await expect(fetchAppsStatusFromHighAvailability()).to.be.rejectedWith('Network error');
	});
});
