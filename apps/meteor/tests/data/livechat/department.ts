import faker from '@faker-js/faker';
import type { ILivechatDepartment, IUser } from '@rocket.chat/core-typings';
import { api, credentials, request } from '../api-data';
import { password } from '../user';
import { createUser, login } from '../users.helper';
import { createAgent, makeAgentAvailable } from './rooms';
import type { DummyResponse } from './utils';

export const createDepartment = (initialAgents: { agentId: string, username: string }[] = []): Promise<ILivechatDepartment> =>
	new Promise((resolve, reject) => {
		request
			.post(api('livechat/department'))
			.send({
				department: {
					enabled: true,
					email: faker.internet.email(),
					showOnRegistration: true,
					showOnOfflineForm: true,
					name: `new department ${Date.now()}`,
					description: 'created from api',
				},
                agents: initialAgents,
			})
			.set(credentials)
			.end((err: Error, res: DummyResponse<ILivechatDepartment>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.department);
			});
	});

export const createDepartmentWithAnOnlineAgent = async (): Promise<{department: ILivechatDepartment, agent: IUser}> => {
	const agent: IUser = await createUser();
	const createdUserCredentials = await login(agent.username, password);
	await createAgent(agent.username);
	await makeAgentAvailable(createdUserCredentials);

	const department = await createDepartment();

	await addOrRemoveAgentFromDepartment(department._id, {agentId: agent._id, username: (agent.username as string)}, true);

	return {
		department,
		agent,
	};
};

export const addOrRemoveAgentFromDepartment = async (departmentId: string, agent: { agentId: string; username: string; count?: number; order?: number }, add: boolean) => {
	const response = await request.post(api('livechat/department/' + departmentId + '/agents')).set(credentials).send({
		...add ? { upsert: [agent], remove: [] } : { remove: [agent], upsert: [] },
	});

	if (response.status !== 200) {
		throw new Error('Failed to add or remove agent from department. Status code: ' + response.status + '\n' + response.body);
	}
}
