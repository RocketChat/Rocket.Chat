import type { IAppServerOrchestrator, IAppsDepartment } from '@rocket.chat/apps';
import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment } from '@rocket.chat/models';

import { AppDepartmentsConverter } from './departments';

jest.mock('@rocket.chat/models', () => ({
	LivechatDepartment: {
		findOneById: jest.fn(),
	},
}));

describe('AppDepartmentsConverter', () => {
	let converter: AppDepartmentsConverter;

	beforeEach(() => {
		converter = new AppDepartmentsConverter({} as IAppServerOrchestrator);
		jest.clearAllMocks();
	});

	describe('convertById', () => {
		it('should convert a department by id', async () => {
			const mockDepartment: ILivechatDepartment = {
				_id: 'dept1',
				name: 'Sales',
				email: 'sales@example.com',
				_updatedAt: new Date('2023-01-01'),
				enabled: true,
				numAgents: 5,
				showOnOfflineForm: true,
				showOnRegistration: true,
				description: 'Sales department',
				offlineMessageChannelName: 'sales-offline',
				requestTagBeforeClosingChat: false,
				chatClosingTags: ['resolved'],
				abandonedRoomsCloseCustomMessage: 'Goodbye',
				waitingQueueMessage: 'Please wait',
				departmentsAllowedToForward: ['dept2'],
			};

			(LivechatDepartment.findOneById as jest.Mock).mockResolvedValue(mockDepartment);

			const result = await converter.convertById('dept1');

			expect(LivechatDepartment.findOneById).toHaveBeenCalledWith('dept1');
			expect(result).toMatchObject({
				id: 'dept1',
				name: 'Sales',
				email: 'sales@example.com',
				updatedAt: new Date('2023-01-01'),
				enabled: true,
				numberOfAgents: 5,
				showOnOfflineForm: true,
				showOnRegistration: true,
				description: 'Sales department',
				offlineMessageChannelName: 'sales-offline',
				requestTagBeforeClosingChat: false,
				chatClosingTags: ['resolved'],
				abandonedRoomsCloseCustomMessage: 'Goodbye',
				waitingQueueMessage: 'Please wait',
				departmentsAllowedToForward: ['dept2'],
			});
		});

		it('should return undefined when department is not found', async () => {
			(LivechatDepartment.findOneById as jest.Mock).mockResolvedValue(null);

			const result = await converter.convertById('nonexistent');

			expect(result).toBeUndefined();
		});
	});

	describe('convertDepartment', () => {
		it('should return undefined when department is null', async () => {
			const result = await converter.convertDepartment(null);
			expect(result).toBeUndefined();
		});

		it('should return undefined when department is undefined', async () => {
			const result = await converter.convertDepartment(undefined);
			expect(result).toBeUndefined();
		});

		it('should convert a department with all fields', async () => {
			const mockDepartment: ILivechatDepartment = {
				_id: 'dept1',
				name: 'Support',
				email: 'support@example.com',
				_updatedAt: new Date('2023-02-01'),
				enabled: true,
				numAgents: 10,
				showOnOfflineForm: false,
				showOnRegistration: false,
				description: 'Support department',
				offlineMessageChannelName: 'support-offline',
				requestTagBeforeClosingChat: true,
				chatClosingTags: ['closed', 'resolved'],
				abandonedRoomsCloseCustomMessage: 'Chat closed',
				waitingQueueMessage: 'Waiting...',
				departmentsAllowedToForward: ['dept2', 'dept3'],
			};

			const result = await converter.convertDepartment(mockDepartment);

			expect(result).toMatchObject({
				id: 'dept1',
				name: 'Support',
				email: 'support@example.com',
				updatedAt: new Date('2023-02-01'),
				enabled: true,
				numberOfAgents: 10,
				showOnOfflineForm: false,
				showOnRegistration: false,
				description: 'Support department',
				offlineMessageChannelName: 'support-offline',
				requestTagBeforeClosingChat: true,
				chatClosingTags: ['closed', 'resolved'],
				abandonedRoomsCloseCustomMessage: 'Chat closed',
				waitingQueueMessage: 'Waiting...',
				departmentsAllowedToForward: ['dept2', 'dept3'],
			});
		});

		it('should convert a department with minimal fields', async () => {
			const mockDepartment: ILivechatDepartment = {
				_id: 'dept2',
				name: 'Minimal',
				email: 'minimal@example.com',
				_updatedAt: new Date('2023-03-01'),
				enabled: false,
				numAgents: 1,
				showOnOfflineForm: true,
				showOnRegistration: true,
				offlineMessageChannelName: 'minimal-offline',
			};

			const result = await converter.convertDepartment(mockDepartment);

			expect(result).toMatchObject({
				id: 'dept2',
				name: 'Minimal',
				email: 'minimal@example.com',
				updatedAt: new Date('2023-03-01'),
				enabled: false,
				numberOfAgents: 1,
				showOnOfflineForm: true,
				showOnRegistration: true,
			});
		});
	});

	describe('convertAppDepartment', () => {
		it('should return undefined when department is null', () => {
			const result = converter.convertAppDepartment(null);
			expect(result).toBeUndefined();
		});

		it('should return undefined when department is undefined', () => {
			const result = converter.convertAppDepartment(undefined);
			expect(result).toBeUndefined();
		});

		it('should convert an app department to livechat department', () => {
			const appDepartment: IAppsDepartment = {
				id: 'dept1',
				name: 'Sales',
				email: 'sales@example.com',
				updatedAt: new Date('2023-01-01'),
				enabled: true,
				numberOfAgents: 5,
				showOnOfflineForm: true,
				showOnRegistration: true,
				description: 'Sales department',
				offlineMessageChannelName: 'sales-offline',
				requestTagBeforeClosingChat: false,
				chatClosingTags: ['resolved'],
				abandonedRoomsCloseCustomMessage: 'Goodbye',
				waitingQueueMessage: 'Please wait',
				departmentsAllowedToForward: ['dept2'],
			};

			const result = converter.convertAppDepartment(appDepartment);

			expect(result).toEqual({
				_id: 'dept1',
				name: 'Sales',
				email: 'sales@example.com',
				_updatedAt: new Date('2023-01-01'),
				enabled: true,
				numAgents: 5,
				showOnOfflineForm: true,
				showOnRegistration: true,
				description: 'Sales department',
				offlineMessageChannelName: 'sales-offline',
				requestTagBeforeClosingChat: false,
				chatClosingTags: ['resolved'],
				abandonedRoomsCloseCustomMessage: 'Goodbye',
				waitingQueueMessage: 'Please wait',
				departmentsAllowedToForward: ['dept2'],
			});
		});

		it('should handle unmapped properties', () => {
			const appDepartment: IAppsDepartment & { _unmappedProperties_?: Record<string, any> } = {
				id: 'dept2',
				name: 'Support',
				email: 'support@example.com',
				updatedAt: new Date('2023-02-01'),
				enabled: true,
				numberOfAgents: 10,
				showOnOfflineForm: false,
				showOnRegistration: false,
				offlineMessageChannelName: 'support-offline',
				_unmappedProperties_: {
					customField1: 'value1',
					customField2: 'value2',
				},
			};

			const result = converter.convertAppDepartment(appDepartment);

			expect(result).toMatchObject({
				_id: 'dept2',
				name: 'Support',
				email: 'support@example.com',
				customField1: 'value1',
				customField2: 'value2',
			});
		});

		it('should convert an app department with minimal fields', () => {
			const appDepartment: IAppsDepartment = {
				id: 'dept3',
				name: 'Minimal',
				email: 'minimal@example.com',
				updatedAt: new Date('2023-03-01'),
				enabled: false,
				numberOfAgents: 1,
				showOnOfflineForm: true,
				showOnRegistration: true,
				offlineMessageChannelName: 'minimal-offline',
			};

			const result = converter.convertAppDepartment(appDepartment);

			expect(result).toEqual({
				_id: 'dept3',
				name: 'Minimal',
				email: 'minimal@example.com',
				_updatedAt: new Date('2023-03-01'),
				enabled: false,
				numAgents: 1,
				showOnOfflineForm: true,
				showOnRegistration: true,
				offlineMessageChannelName: 'minimal-offline',
			});
		});
	});
});
