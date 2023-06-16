import { Api } from '../../src/lib/Api';

describe('Core Services - API', () => {
	const brokerMock: any = {
		createService: jest.fn(),
		destroyService: jest.fn(),
	};
	const enterpriseAdapterMock: any = {
		hasModuleEnabled: jest.fn(),
		onModuleEnabled: jest.fn(),
	};
	const instanceMock: any = {
		setApi: jest.fn(),
		getName: () => 'name',
	};
	const eeInstanceMock: any = {
		setApi: jest.fn(),
		getName: () => 'ee-name',
	};

	afterEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	describe('#setBroker()', () => {
		it('should throw an error if no enterprise adapter was defined', () => {
			const api = new Api();
			expect(() => api.setBroker(brokerMock)).toThrowError('You must set an enterprise adapter before setting a broker.');
		});
		it('should create all services in the broker', () => {
			const api = new Api();
			api.setEnterpriseAdapter(enterpriseAdapterMock);
			api.registerService(instanceMock);
			api.registerService(eeInstanceMock);
			api.setBroker(brokerMock);

			expect(brokerMock.createService).toBeCalledTimes(2);
			expect(brokerMock.createService).toBeCalledWith(instanceMock, undefined);
			expect(brokerMock.createService).toBeCalledWith(eeInstanceMock, undefined);
		});

		it('should create all enterprise services in the broker if there is a valid license for the specific module', () => {
			const api = new Api();
			enterpriseAdapterMock.hasModuleEnabled.mockReturnValue(true);
			api.setEnterpriseAdapter(enterpriseAdapterMock);
			api.registerEnterpriseService(instanceMock, eeInstanceMock, 'module');
			api.setBroker(brokerMock);

			expect(brokerMock.createService).toBeCalledTimes(1);
			expect(brokerMock.createService).toBeCalledWith(eeInstanceMock, undefined);
		});

		it('should create all enterprise services in the broker but it should register the CE instance if no license for the module was found', () => {
			const api = new Api();
			enterpriseAdapterMock.hasModuleEnabled.mockReturnValue(false);
			api.setEnterpriseAdapter(enterpriseAdapterMock);
			api.registerEnterpriseService(instanceMock, eeInstanceMock, 'module');
			api.setBroker(brokerMock);

			expect(brokerMock.createService).toBeCalledTimes(1);
			expect(brokerMock.createService).toBeCalledWith(instanceMock, undefined);
		});
	});

	describe('#registerEnterpriseService()', () => {
		const api = new Api();
		it('should throw an error if no module name was provided', () => {
			expect(() => api.registerEnterpriseService(instanceMock, eeInstanceMock, '')).toThrowError(
				'You must provide a module name to register the enterprise service.',
			);
		});
		it('should throw an error if no enterprise adapter was defined', () => {
			expect(() => api.registerEnterpriseService(instanceMock, eeInstanceMock, 'module')).toThrowError(
				'You must set an enterprise adapter before registering an enterprise service.',
			);
		});
		it('should NOT create the service in the broker if the broker was NOT previously set', () => {
			api.setEnterpriseAdapter(enterpriseAdapterMock);
			api.registerEnterpriseService(instanceMock, eeInstanceMock, 'module');

			expect(brokerMock.createService).not.toBeCalled();
		});
		it('should create the CE service in the broker if the broker was previously set and its a CE env', () => {
			enterpriseAdapterMock.hasModuleEnabled.mockReturnValue(false);
			api.setEnterpriseAdapter(enterpriseAdapterMock);
			api.setBroker(brokerMock);
			api.registerEnterpriseService(instanceMock, eeInstanceMock, 'module');

			expect(brokerMock.createService).toBeCalledWith(instanceMock, undefined);
		});
		it('should create the EE service in the broker if the broker was previously set and its an EE env', () => {
			enterpriseAdapterMock.hasModuleEnabled.mockReturnValue(true);
			api.setEnterpriseAdapter(enterpriseAdapterMock);
			api.setBroker(brokerMock);
			api.registerEnterpriseService(instanceMock, eeInstanceMock, 'module');

			expect(brokerMock.createService).toBeCalledWith(eeInstanceMock, undefined);
		});
		it('should register a listener for any licensing changes (based on module name)', () => {
			api.setEnterpriseAdapter(enterpriseAdapterMock);
			api.registerEnterpriseService(instanceMock, eeInstanceMock, 'module');

			expect(enterpriseAdapterMock.onModuleEnabled).toBeCalledWith('module', expect.any(Function));
		});
		it('should destroy the CE instance and create an EE instance whenever a licensing change was dispatched', async () => {
			api.setEnterpriseAdapter(enterpriseAdapterMock);
			api.registerEnterpriseService(instanceMock, eeInstanceMock, 'module');
			await enterpriseAdapterMock.onModuleEnabled.mock.calls[0][1]();

			expect(brokerMock.destroyService).toBeCalledWith(instanceMock);
			expect(brokerMock.createService).toBeCalledWith(eeInstanceMock, undefined);
		});
	});
});
