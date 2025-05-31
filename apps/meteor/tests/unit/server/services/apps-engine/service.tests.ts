import type { IAppsEngineService } from '@rocket.chat/core-services';
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const AppsMock = {
	self: {
		isInitialized: sinon.stub(),
		getManager: sinon.stub(),
		getStorage: sinon.stub(),
		getAppSourceStorage: sinon.stub(),
		getRocketChatLogger: sinon.stub(),
		triggerEvent: sinon.stub(),
	},
};

const apiMock = {
	call: sinon.stub(),
	nodeList: sinon.stub(),
};

const isRunningMsMock = sinon.stub();

const serviceMocks = {
	'@rocket.chat/apps': { Apps: AppsMock },
	'@rocket.chat/core-services': {
		api: apiMock,
		ServiceClassInternal: class {
			onEvent = sinon.stub();
		},
	},
	'../../lib/isRunningMs': { isRunningMs: isRunningMsMock },
	'../../lib/logger/system': { SystemLogger: { error: sinon.stub() } },
};

const { AppsEngineService } = proxyquire.noCallThru().load('../../../../../server/services/apps-engine/service', serviceMocks);

describe('AppsEngineService', () => {
	let service: IAppsEngineService;

	it('should instantiate properly', () => {
		expect(new AppsEngineService()).to.be.instanceOf(AppsEngineService);
	});

	describe('#getAppsStatusInNode - part 1', () => {
		it('should error if api is not available', async () => {
			isRunningMsMock.returns(true);

			const service = new AppsEngineService();
			await expect(service.getAppsStatusInNodes()).to.be.rejectedWith('AppsEngineService is not initialized');
		});
	});

	beforeEach(() => {
		service = new AppsEngineService();
		(service as any).api = apiMock;
	});

	afterEach(() => {
		apiMock.call.reset();
		apiMock.nodeList.reset();
		AppsMock.self.isInitialized.reset();
		AppsMock.self.getManager.reset();
		AppsMock.self.getStorage.reset();
		AppsMock.self.getAppSourceStorage.reset();
		AppsMock.self.getRocketChatLogger.reset();
		AppsMock.self.triggerEvent.reset();
		isRunningMsMock.reset();
	});

	describe('#isInitialized', () => {
		it('should return true when Apps is initialized', () => {
			AppsMock.self.isInitialized.returns(true);
			expect(service.isInitialized()).to.be.true;
		});

		it('should return false when Apps is not initialized', () => {
			AppsMock.self.isInitialized.returns(false);
			expect(service.isInitialized()).to.be.false;
		});
	});

	describe('#getApps', () => {
		it('should return app info from manager', async () => {
			const mockApps = [{ getInfo: () => ({ id: 'app1' }) }];
			const mockManager = { get: sinon.stub().resolves(mockApps) };
			AppsMock.self.getManager.returns(mockManager);

			const result = await service.getApps({});
			expect(result).to.deep.equal([{ id: 'app1' }]);
		});

		it('should return undefined when manager is not available', async () => {
			AppsMock.self.getManager.returns(undefined);
			const result = await service.getApps({});
			expect(result).to.be.undefined;
		});
	});

	describe('#getAppsStatusLocal', () => {
		it('should return app status reports', async () => {
			const mockApps = [
				{
					getStatus: sinon.stub().resolves('enabled'),
					getID: sinon.stub().returns('app1'),
				},
			];
			const mockManager = { get: sinon.stub().resolves(mockApps) };
			AppsMock.self.getManager.returns(mockManager);

			const result = await service.getAppsStatusLocal();
			expect(result).to.deep.equal([
				{
					status: 'enabled',
					appId: 'app1',
				},
			]);
		});

		it('should return empty array when manager is not available', async () => {
			AppsMock.self.getManager.returns(undefined);
			const result = await service.getAppsStatusLocal();
			expect(result).to.deep.equal([]);
		});
	});

	describe('#getAppStorageItemById', () => {
		it('should return storage item for existing app', async () => {
			const mockStorageItem = { id: 'app1' };
			const mockApp = {
				getStorageItem: sinon.stub().returns(mockStorageItem),
			};
			const mockManager = { getOneById: sinon.stub().returns(mockApp) };
			AppsMock.self.getManager.returns(mockManager);

			const result = await service.getAppStorageItemById('app1');
			expect(result).to.equal(mockStorageItem);
		});

		it('should return undefined for non-existent app', async () => {
			const mockManager = { getOneById: sinon.stub().returns(undefined) };
			AppsMock.self.getManager.returns(mockManager);

			const result = await service.getAppStorageItemById('non-existent');
			expect(result).to.be.undefined;
		});
	});

	describe('#getAppsStatusInNode - part 2', () => {
		it('should throw error when not in microservices mode', async () => {
			isRunningMsMock.returns(false);
			await expect(service.getAppsStatusInNodes()).to.be.rejectedWith(
				'Getting apps status in cluster is only available in microservices mode',
			);
		});

		it('should throw error when not enough apps-engine nodes are available', async () => {
			isRunningMsMock.returns(true);
			apiMock.nodeList.resolves([{ id: 'node1', local: true }]);
			apiMock.call.resolves([{ name: 'apps-engine', nodes: ['node1'] }]);

			await expect(service.getAppsStatusInNodes()).to.be.rejectedWith('Not enough Apps-Engine nodes in deployment');
		});

		it('should not call the service for the local node', async () => {
			isRunningMsMock.returns(true);
			apiMock.nodeList.resolves([{ id: 'node1', local: true }]);
			apiMock.call
				.onFirstCall()
				.resolves([{ name: 'apps-engine', nodes: ['node1', 'node2'] }])
				.onSecondCall()
				.resolves([
					{ status: 'enabled', appId: 'app1' },
					{ status: 'enabled', appId: 'app2' },
				])
				.onThirdCall()
				.rejects(new Error('Should not be called'));

			const result = await service.getAppsStatusInNodes();

			expect(result).to.deep.equal({
				app1: [{ instanceId: 'node2', status: 'enabled' }],
				app2: [{ instanceId: 'node2', status: 'enabled' }],
			});
		});

		it('should return status from all nodes', async () => {
			isRunningMsMock.returns(true);
			apiMock.nodeList.resolves([{ id: 'node1', local: true }]);
			apiMock.call
				.onFirstCall()
				.resolves([{ name: 'apps-engine', nodes: ['node1', 'node2', 'node3'] }])
				.onSecondCall()
				.resolves([
					{ status: 'enabled', appId: 'app1' },
					{ status: 'enabled', appId: 'app2' },
				])
				.onThirdCall()
				.resolves([
					{ status: 'initialized', appId: 'app1' },
					{ status: 'enabled', appId: 'app2' },
				]);

			const result = await service.getAppsStatusInNodes();

			expect(result).to.deep.equal({
				app1: [
					{ instanceId: 'node2', status: 'enabled' },
					{ instanceId: 'node3', status: 'initialized' },
				],
				app2: [
					{ instanceId: 'node2', status: 'enabled' },
					{ instanceId: 'node3', status: 'enabled' },
				],
			});
		});

		it('should throw error when failed to get status from a node', async () => {
			isRunningMsMock.returns(true);
			apiMock.nodeList.resolves([{ id: 'node1', local: true }]);
			apiMock.call
				.onFirstCall()
				.resolves([{ name: 'apps-engine', nodes: ['node1', 'node2'] }])
				.onSecondCall()
				.resolves(undefined);

			await expect(service.getAppsStatusInNodes()).to.be.rejectedWith('Failed to get apps status from node node2');
		});
	});
});
