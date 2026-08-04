import type { IUser } from '@rocket.chat/core-typings';

import { getAgentDerivedFromUser } from './getAgentDerivedFromUser';
import { createFakeUser } from '../../../../../../../../../../tests/mocks/data';

describe('getAgentDerivedFromUser', () => {
	it('should throw an error if the user is null', () => {
		expect(() => getAgentDerivedFromUser(null, 'any-department-id')).toThrow('User is not a livechat agent');
	});

	it('should throw an error if the user is not a livechat agent', () => {
		const user: IUser = createFakeUser({ roles: ['user'] });

		expect(() => getAgentDerivedFromUser(user, 'any-department-id')).toThrow('User is not a livechat agent');
	});

	it('should return a valid agent object if the user is a livechat agent', () => {
		const user: IUser = createFakeUser({
			_id: 'agentId123',
			username: 'agentusername',
			roles: ['livechat-agent'],
		});

		const departmentId = 'department123';

		const agent = getAgentDerivedFromUser(user, departmentId);

		expect(agent).toEqual({
			agentId: user._id,
			username: user.username,
			_id: user._id,
			_updatedAt: expect.any(String),
			departmentId,
			departmentEnabled: true,
			count: 0,
			order: 0,
		});
	});
});
