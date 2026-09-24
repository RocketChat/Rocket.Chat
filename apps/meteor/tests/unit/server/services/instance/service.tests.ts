import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import type { IInstanceService } from '../../../../../ee/server/sdk/types/IInstanceService';

const ServiceBrokerMock = {
	call: sinon.stub(),
	broadcast: sinon.stub(),
	createService: sinon.stub(),
};

const AppsMock = {
	getAppsStatusLocal: sinon.stub(),
};

const LocalBrokerMock = {
	setClusterTransport: sinon.stub(),
	broadcastLocal: sinon.stub(),
};

const serviceMocks = {
	'@rocket.chat/core-services': {
		ServiceClassInternal: class {
			onEvent = sinon.stub();

			onSettingChanged = sinon.stub();
		},
		Apps: AppsMock,
	},
	'@rocket.chat/instance-status': {
		InstanceStatus: { id: () => 'self' },
		defaultPingInterval: 10,
		indexExpire: 30,
	},
	'./getTransporter': {
		getTransporter: () => 'nats://localhost:4222',
	},
	'../../../../server/lib/notifications/core/lib/Notifications': {
		default: { getStream: sinon.stub() },
	},
	'moleculer': {
		ServiceBroker: sinon.stub().returns(ServiceBrokerMock),
		Serializers: {
			Base: class {},
		},
		Transporters: {
			NATS: class {},
			TCP: class {},
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
		service = new InstanceService(LocalBrokerMock);
		(service as any).broker = ServiceBrokerMock;
	});

	afterEach(() => {
		ServiceBrokerMock.call.reset();
		ServiceBrokerMock.broadcast.reset();
		ServiceBrokerMock.createService.reset();
		AppsMock.getAppsStatusLocal.reset();
		LocalBrokerMock.setClusterTransport.reset();
		LocalBrokerMock.broadcastLocal.reset();
	});

	describe('cluster transport', () => {
		const startBroadcast = async () => {
			await (service as any).startBroadcast();
			expect(LocalBrokerMock.setClusterTransport.calledOnce).to.be.true;
			return LocalBrokerMock.setClusterTransport.firstCall.args[0] as { publish(event: string, args: unknown[]): void };
		};

		it('should send local broker broadcasts to the other instances', async () => {
			const transport = await startBroadcast();

			transport.publish('user.name', [{ _id: 'u1' }]);

			expect(ServiceBrokerMock.broadcast.calledOnceWith('event', { event: 'user.name', args: [{ _id: 'u1' }] })).to.be.true;
		});

		it('should not send anything while instance broadcast is disabled for troubleshooting', async () => {
			const transport = await startBroadcast();
			(service as any).troubleshootDisableInstanceBroadcast = true;

			transport.publish('user.name', [{ _id: 'u1' }]);

			expect(ServiceBrokerMock.broadcast.called).to.be.false;
		});

		it('should install the transport only once', async () => {
			await startBroadcast();
			await (service as any).startBroadcast();

			expect(LocalBrokerMock.setClusterTransport.calledOnce).to.be.true;
		});

		describe('receiving', () => {
			const receive = async (params: unknown, nodeID: string) => {
				await (service as any).created();
				const [schema] = ServiceBrokerMock.createService.firstCall.args;
				schema.events.event({ params, nodeID });
			};

			it('should deliver events from other instances to this instance only', async () => {
				await receive({ event: 'user.name', args: [{ _id: 'u1' }, 'extra'] }, 'other');

				expect(LocalBrokerMock.broadcastLocal.calledOnceWith('user.name', { _id: 'u1' }, 'extra')).to.be.true;
			});

			it('should ignore its own events', async () => {
				await receive({ event: 'user.name', args: [{ _id: 'u1' }] }, 'self');

				expect(LocalBrokerMock.broadcastLocal.called).to.be.false;
			});
		});
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
		it('should return app status from all instances', async () => {
			const mockInstances = [
				{ id: 'node1', local: true },
				{ id: 'node2', local: false },
				{ id: 'node3', local: false },
			];

			ServiceBrokerMock.call
				.onCall(0)
				.resolves(mockInstances)
				.onCall(1)
				.resolves([{ status: 'enabled', appId: 'app1' }])
				.onCall(2)
				.resolves([{ status: 'disabled', appId: 'app2' }])
				.onCall(3)
				.resolves([{ status: 'enabled', appId: 'app3' }]);

			const result = await service.getAppsStatusInInstances();

			expect(result).to.deep.equal({
				app1: [{ instanceId: 'node1', isLocal: true, status: 'enabled' }],
				app2: [{ instanceId: 'node2', isLocal: false, status: 'disabled' }],
				app3: [{ instanceId: 'node3', isLocal: false, status: 'enabled' }],
			});

			expect(ServiceBrokerMock.call.callCount).to.be.equal(4);
		});

		it('should handle empty app status response', async () => {
			const mockInstances = [
				{ id: 'node1', local: true },
				{ id: 'node2', local: false },
			];

			ServiceBrokerMock.call.onFirstCall().resolves(mockInstances).onSecondCall().resolves([]).onThirdCall().resolves([]);
			const result = await service.getAppsStatusInInstances();

			expect(result).to.deep.equal({});
			expect(ServiceBrokerMock.call.calledThrice).to.be.true;
		});

		it('should handle undefined app status response', async () => {
			const mockInstances = [
				{ id: 'node1', local: true },
				{ id: 'node2', local: false },
			];

			ServiceBrokerMock.call.onFirstCall().resolves(mockInstances).onSecondCall().resolves(undefined);

			await expect(service.getAppsStatusInInstances()).to.be.rejectedWith(`Failed to get apps status from instance node1`);
			expect(ServiceBrokerMock.call.calledThrice).to.be.true;
		});
	});
});
