import { Authorization } from '@rocket.chat/core-services';
import { LivechatUnit, LivechatDepartmentAgents } from '@rocket.chat/models';

import { getUnitsFromUser } from './getUnitsFromUser';
import { defaultLogger } from '../utils/logger';

// Mock the dependencies
jest.mock('@rocket.chat/core-services', () => ({
	Authorization: {
		hasAnyRole: jest.fn(),
	},
}));
jest.mock('@rocket.chat/models', () => ({
	LivechatUnit: {
		findByMonitorId: jest.fn(),
		countUnits: jest.fn(),
	},
	LivechatDepartmentAgents: {
		findByAgentId: jest.fn(),
	},
}));

jest.mock('mem', () => (fn: any) => fn);
jest.mock('../utils/logger');

const mockAuthorization = Authorization as jest.Mocked<typeof Authorization>;
const mockLivechatUnit = LivechatUnit as jest.Mocked<typeof LivechatUnit>;
const mockLivechatDepartmentAgents = LivechatDepartmentAgents as jest.Mocked<typeof LivechatDepartmentAgents>;
const mockLogger = defaultLogger as jest.Mocked<typeof defaultLogger>;
describe('getUnitsFromUser', () => {
	beforeEach(() => {
		jest.resetAllMocks();

		// Setup default mock implementations
		mockLivechatUnit.findByMonitorId.mockResolvedValue(['unit1', 'unit2']);
		mockLivechatDepartmentAgents.findByAgentId.mockReturnValue({
			toArray: jest.fn().mockResolvedValue([{ departmentId: 'dept1' }, { departmentId: 'dept2' }]),
		} as any);
		mockLivechatUnit.countUnits.mockResolvedValue(5);

		mockAuthorization.hasAnyRole.mockResolvedValue(false);
		mockLogger.debug.mockImplementation(() => {
			//
		});
	});

	describe('when userId is not provided', () => {
		it('should return undefined for null userId', async () => {
			const result = await getUnitsFromUser(null as any);
			expect(result).toBeUndefined();
		});

		it('should return undefined for undefined userId', async () => {
			const result = await getUnitsFromUser(undefined);
			expect(result).toBeUndefined();
		});

		it('should return undefined for empty string userId', async () => {
			const result = await getUnitsFromUser('');
			expect(result).toBeUndefined();
		});
	});

	describe('when there are no units in the system', () => {
		it('should return undefined', async () => {
			mockLivechatUnit.countUnits.mockResolvedValue(0);

			const result = await getUnitsFromUser('user123');

			expect(result).toBeUndefined();
			expect(mockLivechatUnit.countUnits).toHaveBeenCalled();
		});
	});

	describe('when user has admin role', () => {
		it('should return undefined for admin users', async () => {
			mockAuthorization.hasAnyRole
				.mockResolvedValueOnce(true) // admin/livechat-manager check
				.mockResolvedValueOnce(false); // livechat-monitor/agent check

			const result = await getUnitsFromUser('admin-user');

			expect(mockLivechatUnit.countUnits).toHaveBeenCalled();
			expect(result).toBeUndefined();
			expect(mockAuthorization.hasAnyRole).toHaveBeenCalledWith('admin-user', ['admin', 'livechat-manager']);
		});
	});

	describe('when user does not have required roles', () => {
		it('should return undefined for users without livechat-monitor or livechat-agent roles', async () => {
			mockAuthorization.hasAnyRole
				.mockResolvedValueOnce(false) // admin/livechat-manager check
				.mockResolvedValueOnce(false); // livechat-monitor/agent check

			const result = await getUnitsFromUser('regular-user');

			expect(result).toBeUndefined();
			expect(mockAuthorization.hasAnyRole).toHaveBeenCalledWith('regular-user', ['admin', 'livechat-manager']);
			expect(mockAuthorization.hasAnyRole).toHaveBeenCalledWith('regular-user', ['livechat-monitor', 'livechat-agent']);
		});
	});

	describe('when user has livechat-manager role', () => {
		it('should return undefined for livechat-manager users', async () => {
			mockAuthorization.hasAnyRole
				.mockResolvedValueOnce(true) // admin/livechat-manager check
				.mockResolvedValueOnce(false); // livechat-monitor/agent check

			const result = await getUnitsFromUser('manager-user');

			expect(result).toBeUndefined();
			expect(mockAuthorization.hasAnyRole).toHaveBeenCalledWith('manager-user', ['admin', 'livechat-manager']);
		});
	});

	describe('when user has livechat-monitor role', () => {
		it('should return combined units and departments', async () => {
			const userId = 'monitor-user';
			mockAuthorization.hasAnyRole
				.mockResolvedValueOnce(false) // admin/livechat-manager check
				.mockResolvedValueOnce(true); // livechat-monitor/agent check

			mockLivechatUnit.findByMonitorId.mockResolvedValue(['unit1', 'unit2']);
			mockLivechatDepartmentAgents.findByAgentId.mockReturnValue({
				toArray: jest.fn().mockResolvedValue([{ departmentId: 'dept1' }, { departmentId: 'dept2' }]),
			} as any);

			const result = await getUnitsFromUser(userId);

			expect(result).toEqual(['unit1', 'unit2', 'dept1', 'dept2']);
			expect(mockLivechatUnit.findByMonitorId).toHaveBeenCalledWith(userId);
			expect(mockLivechatDepartmentAgents.findByAgentId).toHaveBeenCalledWith(userId);
			expect(mockLogger.debug).toHaveBeenCalledWith({
				msg: 'Calculating units for monitor',
				user: userId,
				unitsAndDepartments: ['unit1', 'unit2', 'dept1', 'dept2'],
			});
		});
	});

	describe('when user has livechat-agent role', () => {
		it('should return combined units and departments', async () => {
			const userId = 'agent-user';
			mockAuthorization.hasAnyRole
				.mockResolvedValueOnce(false) // admin/livechat-manager check
				.mockResolvedValueOnce(true); // livechat-monitor/agent check

			mockLivechatUnit.findByMonitorId.mockResolvedValue(['unit3']);
			mockLivechatDepartmentAgents.findByAgentId.mockReturnValue({
				toArray: jest.fn().mockResolvedValue([{ departmentId: 'dept3' }, { departmentId: 'dept4' }]),
			} as any);

			const result = await getUnitsFromUser(userId);

			expect(result).toEqual(['unit3', 'dept3', 'dept4']);
			expect(mockLivechatUnit.findByMonitorId).toHaveBeenCalledWith(userId);
			expect(mockLivechatDepartmentAgents.findByAgentId).toHaveBeenCalledWith(userId);
		});
	});

	describe('edge cases', () => {
		it('should handle empty units and departments arrays', async () => {
			const userId = 'empty-user';
			mockAuthorization.hasAnyRole
				.mockResolvedValueOnce(false) // admin/livechat-manager check
				.mockResolvedValueOnce(true); // livechat-monitor/agent check

			mockLivechatUnit.findByMonitorId.mockResolvedValue([]);
			mockLivechatDepartmentAgents.findByAgentId.mockReturnValue({
				toArray: jest.fn().mockResolvedValue([]),
			} as any);

			const result = await getUnitsFromUser(userId);

			expect(result).toEqual([]);
		});

		it('should handle when only units are returned', async () => {
			const userId = 'units-only-user';
			mockAuthorization.hasAnyRole
				.mockResolvedValueOnce(false) // admin/livechat-manager check
				.mockResolvedValueOnce(true); // livechat-monitor/agent check

			mockLivechatUnit.findByMonitorId.mockResolvedValue(['unit1', 'unit2']);
			mockLivechatDepartmentAgents.findByAgentId.mockReturnValue({
				toArray: jest.fn().mockResolvedValue([]),
			} as any);

			const result = await getUnitsFromUser(userId);

			expect(result).toEqual(['unit1', 'unit2']);
		});

		it('should handle when only departments are returned', async () => {
			const userId = 'departments-only-user';
			mockAuthorization.hasAnyRole
				.mockResolvedValueOnce(false) // admin/livechat-manager check
				.mockResolvedValueOnce(true); // livechat-monitor/agent check

			mockLivechatUnit.findByMonitorId.mockResolvedValue([]);
			mockLivechatDepartmentAgents.findByAgentId.mockReturnValue({
				toArray: jest.fn().mockResolvedValue([{ departmentId: 'dept1' }, { departmentId: 'dept2' }]),
			} as any);

			const result = await getUnitsFromUser(userId);

			expect(result).toEqual(['dept1', 'dept2']);
		});
	});

	describe('memoization', () => {
		it('should work correctly with memoization disabled in tests', async () => {
			const userId = 'test-user';
			mockAuthorization.hasAnyRole
				.mockResolvedValueOnce(false) // admin/livechat-manager check
				.mockResolvedValueOnce(true); // livechat-monitor/agent check

			mockLivechatUnit.findByMonitorId.mockResolvedValue(['unit1']);
			mockLivechatDepartmentAgents.findByAgentId.mockReturnValue({
				toArray: jest.fn().mockResolvedValue([{ departmentId: 'dept1' }]),
			} as any);

			const result = await getUnitsFromUser(userId);

			expect(result).toEqual(['unit1', 'dept1']);
			expect(mockLivechatUnit.findByMonitorId).toHaveBeenCalledWith(userId);
			expect(mockLivechatDepartmentAgents.findByAgentId).toHaveBeenCalledWith(userId);
		});
	});
});
