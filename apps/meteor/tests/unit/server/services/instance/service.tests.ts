import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import type { IInstanceService } from '../../../../../ee/server/sdk/types/IInstanceService';

const ServiceBrokerMock = {
	call: sinon.stub(),
};

const AppsMock = {
	getAppsStatusLocal: sinon.stub(),
};

const serviceMocks = {
	'@rocket.chat/core-services': {
		ServiceClassInternal: class {
			onEvent = sinon.stub();
		},
		Apps: AppsMock,
	},
	'moleculer': {
		ServiceBroker: sinon.stub().returns(ServiceBrokerMock),
		Serializers: {
			Base: class {},
		},
	},
};

const { InstanceService } = proxyquire
	.noPreserveCache()
	.noCallThru()
	.load('../../../../../ee/server/local-services/instance/service', serviceMocks);

describe('InstanceService', () => {
	let service: IInstanceService;

	beforeEach(() => {
		service = new InstanceService();
		(service as any).broker = ServiceBrokerMock;
	});

	afterEach(() => {
		ServiceBrokerMock.call.reset();
		AppsMock.getAppsStatusLocal.reset();
	});

	describe('#getInstances', () => {
		it('should return list of instances', async () => {
			const mockInstances = [{ id: 'node1' }];
			ServiceBrokerMock.call.resolves(mockInstances);

			const instances = await service.getInstances();

			expect(instances).to.deep.equal(mockInstances);
			expect(ServiceBrokerMock.call.calledWith('$node.list', { onlyAvailable: true })).to.be.true;
		});

		it('should handle empty instance list', async () => {
			ServiceBrokerMock.call.resolves([]);

			const instances = await service.getInstances();

			expect(instances).to.deep.equal([]);
			expect(ServiceBrokerMock.call.calledWith('$node.list', { onlyAvailable: true })).to.be.true;
		});
	});

	describe('#getAppsStatusInInstances', () => {
		it('should return app status from all non-local instances', async () => {
			const mockInstances = [
				{ id: 'node1', local: true },
				{ id: 'node2', local: false },
				{ id: 'node3', local: false },
			];

			ServiceBrokerMock.call
				.onFirstCall()
				.resolves(mockInstances)
				.onSecondCall()
				.resolves([{ status: 'enabled', appId: 'app1' }])
				.onThirdCall()
				.resolves([{ status: 'disabled', appId: 'app2' }]);

			const result = await service.getAppsStatusInInstances();

			expect(result).to.deep.equal({
				app1: [{ instanceId: 'node2', status: 'enabled' }],
				app2: [{ instanceId: 'node3', status: 'disabled' }],
			});

			expect(ServiceBrokerMock.call.calledThrice).to.be.true;
		});

		it('should handle empty app status response', async () => {
			const mockInstances = [
				{ id: 'node1', local: true },
				{ id: 'node2', local: false },
			];

			ServiceBrokerMock.call.onFirstCall().resolves(mockInstances).onSecondCall().resolves([]);

			const result = await service.getAppsStatusInInstances();

			expect(result).to.deep.equal({});
			expect(ServiceBrokerMock.call.calledTwice).to.be.true;
		});

		it('should handle undefined app status response', async () => {
			const mockInstances = [
				{ id: 'node1', local: true },
				{ id: 'node2', local: false },
			];

			ServiceBrokerMock.call.onFirstCall().resolves(mockInstances).onSecondCall().resolves(undefined);

			await expect(service.getAppsStatusInInstances()).to.be.rejectedWith(`Failed to get apps status from instance node2`);
			expect(ServiceBrokerMock.call.calledTwice).to.be.true;
		});
	});
});
