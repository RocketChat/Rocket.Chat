import { api, credentials, methodCall, request } from '../api-data';
import { faker } from '@faker-js/faker';
import { createUser, login } from '../users.helper';
import { password } from '../user';
import { createAgent, makeAgentAvailable } from './rooms';
import { ILivechatDepartment, IUser } from '@rocket.chat/core-typings';

export const createDepartmentWithMethod = (initialAgents: { agentId: string, username: string }[] = []) =>
	new Promise((resolve, reject) => {
		request
			.post(methodCall('livechat:saveDepartment'))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:saveDepartment',
					params: ['', {
						enabled: true,
						email: faker.internet.email(),
						showOnRegistration: true,
						showOnOfflineForm: true,
						name: `new department ${Date.now()}`,
						description: 'created from api',
					}, initialAgents],
					id: 'id',
					msg: 'method',
				}),
			})
			.end((err: any, res: any) => {
				if (err) {
					return reject(err);
				}
				resolve(JSON.parse(res.body.message).result);
			});
	});


export const createDepartmentWithAnOnlineAgent = async (): Promise<{department: ILivechatDepartment, agent: IUser}> => {
	const agent: IUser = await createUser();
	const createdUserCredentials = await login(agent.username, password);
	await createAgent(agent.username);
	await makeAgentAvailable(createdUserCredentials);

	const department = await createDepartmentWithMethod() as ILivechatDepartment;

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
