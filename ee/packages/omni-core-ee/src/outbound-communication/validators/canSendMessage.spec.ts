import { Authorization } from '@rocket.chat/core-services';
import { LivechatDepartment, LivechatDepartmentAgents, Users } from '@rocket.chat/models';

import { canSendOutboundMessage } from './canSendMessage';

jest.mock('@rocket.chat/core-services', () => ({
	Authorization: {
		hasPermission: jest.fn(),
	},
}));

jest.mock('@rocket.chat/models', () => ({
	LivechatDepartment: {
		findOne: jest.fn(),
	},
	LivechatDepartmentAgents: {
		findOneByAgentIdAndDepartmentId: jest.fn(),
	},
	Users: {
		findOneAgentById: jest.fn(),
	},
}));

const hasPermissionMock = Authorization.hasPermission as unknown as jest.Mock<
	Promise<boolean>,
	[userId: string, permission: string, scope?: string]
>;

const findDepartmentMock = LivechatDepartment.findOne as unknown as jest.Mock;
const findDepartmentAgentMock = LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId as unknown as jest.Mock;
const findUserAgentMock = Users.findOneAgentById as unknown as jest.Mock;

const setPermissions = (map: Record<string, boolean>) => {
	hasPermissionMock.mockImplementation(async (_userId: string, permission: string) => {
		return Boolean(map[permission]);
	});
};

describe('canSendOutboundMessage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Default: no permissions granted
		setPermissions({});
	});

	describe('when departmentId is provided', () => {
		test('resolves when user has assign-queues permission and department is enabled', async () => {
			setPermissions({ 'outbound.can-assign-queues': true });
			findDepartmentMock.mockResolvedValue({ _id: 'dep1', enabled: true });

			await expect(canSendOutboundMessage('u1', undefined, 'dep1')).resolves.toBeUndefined();

			// Should not need to check requester department membership
			expect(findDepartmentAgentMock).not.toHaveBeenCalled();
		});

		test('throws error-invalid-department when department is disabled', async () => {
			setPermissions({ 'outbound.can-assign-queues': true });
			findDepartmentMock.mockResolvedValue({ _id: 'dep1', enabled: false });

			await expect(canSendOutboundMessage('u1', undefined, 'dep1')).rejects.toThrow('error-invalid-department');
		});

		describe('and agentId is provided', () => {
			test('throws error-invalid-agent if user lacks any-agent and has self-only but agentId != userId', async () => {
				setPermissions({
					'outbound.can-assign-queues': true, // so it skips requester membership
					'outbound.can-assign-any-agent': false,
					'outbound.can-assign-self-only': true,
				});
				findDepartmentMock.mockResolvedValue({ _id: 'dep1', enabled: true });

				await expect(canSendOutboundMessage('me', 'other', 'dep1')).rejects.toThrow('error-invalid-agent');

				// Should not check selected agent membership after permission denial
				expect(findDepartmentAgentMock).not.toHaveBeenCalled();
			});

			test('throws error-agent-not-in-department if selected agent is not in the department (any-agent allowed)', async () => {
				setPermissions({
					'outbound.can-assign-queues': true,
					'outbound.can-assign-any-agent': true,
				});
				findDepartmentMock.mockResolvedValue({ _id: 'dep1', enabled: true });
				findDepartmentAgentMock.mockResolvedValueOnce(null); // selected agent not in department

				await expect(canSendOutboundMessage('me', 'agentX', 'dep1')).rejects.toThrow('error-agent-not-in-department');

				expect(findDepartmentAgentMock).toHaveBeenCalledWith('agentX', 'dep1');
			});

			test('resolves if selected agent is in the department (any-agent allowed)', async () => {
				setPermissions({
					'outbound.can-assign-queues': true,
					'outbound.can-assign-any-agent': true,
				});
				findDepartmentMock.mockResolvedValue({ _id: 'dep1', enabled: true });
				findDepartmentAgentMock.mockResolvedValueOnce({ _id: 'relX' });

				await expect(canSendOutboundMessage('me', 'agentInDep', 'dep1')).resolves.toBeUndefined();
			});

			test('throws error-agent-not-in-department when self-only is allowed and agentId == userId but agent is not in department', async () => {
				setPermissions({
					'outbound.can-assign-queues': true,
					'outbound.can-assign-any-agent': false,
					'outbound.can-assign-self-only': true,
				});
				findDepartmentMock.mockResolvedValue({ _id: 'dep1', enabled: true });
				findDepartmentAgentMock.mockResolvedValueOnce(null); // self not in department

				await expect(canSendOutboundMessage('me', 'me', 'dep1')).rejects.toThrow('error-agent-not-in-department');
			});
		});
	});

	describe('when departmentId is not provided and agentId is provided', () => {
		test('throws error-invalid-agent if user lacks any-agent and has self-only but agentId != userId', async () => {
			setPermissions({
				'outbound.can-assign-any-agent': false,
				'outbound.can-assign-self-only': true,
			});

			await expect(canSendOutboundMessage('me', 'other')).rejects.toThrow('error-invalid-agent');

			// Should not query Users if permission check fails
			expect(findUserAgentMock).not.toHaveBeenCalled();
		});

		test('throws error-invalid-agent if selected agent is not an agent (any-agent allowed)', async () => {
			setPermissions({
				'outbound.can-assign-any-agent': true,
			});
			findUserAgentMock.mockResolvedValueOnce(null);

			await expect(canSendOutboundMessage('me', 'notAnAgent')).rejects.toThrow('error-invalid-agent');

			expect(findUserAgentMock).toHaveBeenCalledWith('notAnAgent', { projection: { _id: 1 } });
		});

		test('resolves if selected agent exists (any-agent allowed)', async () => {
			setPermissions({
				'outbound.can-assign-any-agent': true,
			});
			findUserAgentMock.mockResolvedValueOnce({ _id: 'agent1' });

			await expect(canSendOutboundMessage('me', 'agent1')).resolves.toBeUndefined();
		});
	});

	test('resolves when neither departmentId nor agentId are provided', async () => {
		await expect(canSendOutboundMessage('u1')).resolves.toBeUndefined();

		expect(hasPermissionMock).not.toHaveBeenCalled();
		expect(findDepartmentMock).not.toHaveBeenCalled();
		expect(findDepartmentAgentMock).not.toHaveBeenCalled();
		expect(findUserAgentMock).not.toHaveBeenCalled();
	});
});
