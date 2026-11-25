import { afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import type { ClusterTransport } from '@rocket.chat/core-services';
import { expect } from 'chai';
import * as moleculer from 'moleculer';
import sinon from 'sinon';

import type { IInstanceService } from '../../sdk/types/IInstanceService';

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

const mockServiceDependencies = (transporter: unknown = 'nats://localhost:4222') => {
	mock.module('@rocket.chat/core-services', {
		exports: {
			ServiceClassInternal: class {
				onEvent = sinon.stub();

				onSettingChanged = sinon.stub();
			},
			Apps: AppsMock,
		},
	});
	mock.module('@rocket.chat/instance-status', {
		exports: {
			InstanceStatus: { id: () => 'self' },
			defaultPingInterval: 10,
			indexExpire: 30,
		},
	});
	mock.module('./getTransporter', { exports: { getTransporter: () => transporter } });
	mock.module('moleculer', {
		exports: {
			...moleculer,
			ServiceBroker: sinon.stub().returns(ServiceBrokerMock),
			Serializers: {
				Base: class {},
			},
			Transporters: {
				NATS: class {},
				TCP: class {},
			},
		},
	});
};

let InstanceService: any;

before(async () => {
	mockServiceDependencies();
	({ InstanceService } = await import('./service'));
	mock.restoreAll();
});

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
		const startBroadcast = () => {
			(service as any).startBroadcast();
			expect(LocalBrokerMock.setClusterTransport.calledOnce).to.be.true;
			return LocalBrokerMock.setClusterTransport.firstCall.args[0] as ClusterTransport;
		};

		it('should send local broker broadcasts to the other instances', () => {
			const transport = startBroadcast();

			transport.publish('user.name', [{ _id: 'u1' }]);

			expect(ServiceBrokerMock.broadcast.calledOnceWith('event', { event: 'user.name', args: [{ _id: 'u1' }] })).to.be.true;
		});

		it('should not send anything while instance broadcast is disabled for troubleshooting', () => {
			const transport = startBroadcast();
			(service as any).troubleshootDisableInstanceBroadcast = true;

			transport.publish('user.name', [{ _id: 'u1' }]);

			expect(ServiceBrokerMock.broadcast.called).to.be.false;
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

describe('InstanceService encryption warning', () => {
	const warn = sinon.stub();
	const originalSecret = process.env.MOLECULER_ENCRYPTION_SECRET;

	const load = (transporter: unknown) => {
		mockServiceDependencies(transporter);
		mock.module('../../../../server/lib/logger/system', { exports: { SystemLogger: { warn, error: sinon.stub() } } });
		delete require.cache[require.resolve('./service')];
		// oxlint-disable-next-line @typescript-eslint/no-require-imports
		const { InstanceService } = require('./service');
		mock.restoreAll();
		return InstanceService;
	};

	afterEach(() => {
		warn.reset();
		if (originalSecret === undefined) {
			delete process.env.MOLECULER_ENCRYPTION_SECRET;
		} else {
			process.env.MOLECULER_ENCRYPTION_SECRET = originalSecret;
		}
	});

	it('should warn on created() when the TCP transporter runs without a secret', async () => {
		delete process.env.MOLECULER_ENCRYPTION_SECRET;
		const Service = load({ port: 0 });
		const service = new Service(LocalBrokerMock);
		try {
			await service.created();
		} catch {
			// the TCP-only change stream needs a database; the warning is logged before it
		}

		expect(warn.calledOnce).to.equal(true);
		expect(warn.firstCall.args[0]).to.include('TCP port accepts unauthenticated packets');
	});

	it('should not warn on created() when a secret is set', async () => {
		process.env.MOLECULER_ENCRYPTION_SECRET = 'a-long-random-secret';
		const Service = load({ port: 0 });
		try {
			await new Service(LocalBrokerMock).created();
		} catch {
			// see above
		}

		expect(warn.called).to.equal(false);
	});
});
