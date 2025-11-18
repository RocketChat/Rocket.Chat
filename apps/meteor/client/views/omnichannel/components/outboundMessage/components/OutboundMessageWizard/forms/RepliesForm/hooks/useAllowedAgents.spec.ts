import type { ILivechatDepartmentAgents, IUser, Serialized } from '@rocket.chat/core-typings';
import { renderHook } from '@testing-library/react';

import { useAllowedAgents } from './useAllowedAgents';
import { createFakeUser } from '../../../../../../../../../../tests/mocks/data';
import { getAgentDerivedFromUser } from '../utils/getAgentDerivedFromUser';

jest.mock('../utils/getAgentDerivedFromUser', () => ({
	getAgentDerivedFromUser: jest.fn(),
}));

const getAgentDerivedFromUserMocked = jest.mocked(getAgentDerivedFromUser);

const mockUser: IUser = createFakeUser({
	_id: 'test-user-id',
	username: 'testuser',
	roles: ['livechat-agent'],
});

const mockQueryAgents: Serialized<ILivechatDepartmentAgents>[] = [
	{
		agentId: 'agent1',
		username: 'agent.one',
		count: 1,
		order: 1,
		_id: 'agent1',
		_updatedAt: new Date().toISOString(),
		departmentEnabled: true,
		departmentId: 'dept1',
	},
	{
		agentId: 'agent2',
		username: 'agent.two',
		count: 2,
		order: 2,
		_id: 'agent2',
		_updatedAt: new Date().toISOString(),
		departmentEnabled: true,
		departmentId: 'dept1',
	},
];

const mockDerivedAgent: Serialized<ILivechatDepartmentAgents> = {
	agentId: 'test-user-id',
	username: 'testuser',
	_id: 'test-user-id',
	_updatedAt: new Date().toISOString(),
	departmentId: 'department-1',
	departmentEnabled: true,
	count: 0,
	order: 0,
};

describe('useAllowedAgents', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return an empty array if no departmentId is provided', () => {
		const { result } = renderHook(() =>
			useAllowedAgents({
				user: mockUser,
				departmentId: undefined,
				canAssignSelfOnlyAgent: true,
				canAssignAnyAgent: true,
				queryAgents: mockQueryAgents,
			}),
		);

		expect(result.current).toEqual([]);
	});

	it('should return an empty array if user has no assignment permissions', () => {
		const { result } = renderHook(() =>
			useAllowedAgents({
				user: mockUser,
				departmentId: 'department-1',
				canAssignSelfOnlyAgent: false,
				canAssignAnyAgent: false,
				queryAgents: mockQueryAgents,
			}),
		);

		expect(result.current).toEqual([]);
	});

	it('should return queryAgents if canAssignAnyAgent is true and queryAgents has items', () => {
		const { result } = renderHook(() =>
			useAllowedAgents({
				user: mockUser,
				departmentId: 'department-1',
				canAssignSelfOnlyAgent: false,
				canAssignAnyAgent: true,
				queryAgents: mockQueryAgents,
			}),
		);

		expect(result.current).toEqual(mockQueryAgents);
	});

	it('should return derived agent if canAssignSelfOnlyAgent is true', () => {
		getAgentDerivedFromUserMocked.mockReturnValue(mockDerivedAgent);

		const { result } = renderHook(() =>
			useAllowedAgents({
				user: mockUser,
				departmentId: 'department-1',
				canAssignSelfOnlyAgent: true,
				canAssignAnyAgent: false,
				queryAgents: mockQueryAgents,
			}),
		);

		expect(getAgentDerivedFromUserMocked).toHaveBeenCalledWith(mockUser, 'department-1');
		expect(result.current).toEqual([mockDerivedAgent]);
	});

	it('should return derived agent if canAssignAnyAgent is true but queryAgents is empty', () => {
		getAgentDerivedFromUserMocked.mockReturnValue(mockDerivedAgent);

		const { result } = renderHook(() =>
			useAllowedAgents({
				user: mockUser,
				departmentId: 'department-1',
				canAssignSelfOnlyAgent: false,
				canAssignAnyAgent: true,
				queryAgents: [],
			}),
		);

		expect(getAgentDerivedFromUserMocked).toHaveBeenCalledWith(mockUser, 'department-1');
		expect(result.current).toEqual([mockDerivedAgent]);
	});

	it('should return derived agent if canAssignAnyAgent is true but queryAgents is undefined', () => {
		getAgentDerivedFromUserMocked.mockReturnValue(mockDerivedAgent);

		const { result } = renderHook(() =>
			useAllowedAgents({
				user: mockUser,
				departmentId: 'department-1',
				canAssignSelfOnlyAgent: false,
				canAssignAnyAgent: true,
				queryAgents: undefined,
			}),
		);

		expect(getAgentDerivedFromUserMocked).toHaveBeenCalledWith(mockUser, 'department-1');
		expect(result.current).toEqual([mockDerivedAgent]);
	});

	it('should return an empty array if getAgentDerivedFromUser throws an error', () => {
		getAgentDerivedFromUserMocked.mockImplementation(() => {
			throw new Error('User not found');
		});

		const { result } = renderHook(() =>
			useAllowedAgents({
				user: null,
				departmentId: 'department-1',
				canAssignSelfOnlyAgent: true,
				canAssignAnyAgent: false,
				queryAgents: [],
			}),
		);

		expect(result.current).toEqual([]);
	});
});
