import { faker } from '@faker-js/faker';
import type { Credentials } from '@rocket.chat/api-client';
import type { ILivechatDepartment, IUser, LivechatDepartmentDTO } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { api, credentials, methodCall, request } from '../api-data';
import { createAnOnlineAgent, createAnOfflineAgent } from './users';
import type { WithRequiredProperty } from './utils';

const NewDepartmentData = ((): Partial<ILivechatDepartment> => ({
	enabled: true,
	name: `new department ${Date.now()}`,
	description: 'created from api',
	showOnRegistration: true,
	email: faker.internet.email(),
	showOnOfflineForm: true,
}))();

export const createDepartment = async (
	departmentData: Partial<ILivechatDepartment> = NewDepartmentData,
	agents?: { agentId: string; count?: string; order?: string }[],
): Promise<ILivechatDepartment> => {
	const response = await request
		.post(api('livechat/department'))
		.set(credentials)
		.send({
			department: departmentData,
			...(agents && { agents }),
		})
		.expect(200);
	return response.body.department;
};

const updateDepartment = async (departmentId: string, departmentData: Partial<LivechatDepartmentDTO>): Promise<ILivechatDepartment> => {
	const response = await request
		.put(api(`livechat/department/${departmentId}`))
		.set(credentials)
		.send({
			department: departmentData,
		})
		.expect(200);
	return response.body.department;
};

export const createDepartmentWithMethod = ({
	initialAgents = [],
	allowReceiveForwardOffline = false,
	fallbackForwardDepartment,
	departmentsAllowedToForward,
	name,
	departmentUnit,
	userCredentials = credentials,
	departmentId = '',
}: {
	initialAgents?: { agentId: string; username: string }[];
	allowReceiveForwardOffline?: boolean;
	fallbackForwardDepartment?: string;
	departmentsAllowedToForward?: string[];
	name?: string;
	departmentUnit?: { _id?: string };
	userCredentials?: Credentials;
	departmentId?: string;
} = {}): Promise<ILivechatDepartment> =>
	new Promise((resolve, reject) => {
		void request
			.post(methodCall('livechat:saveDepartment'))
			.set(userCredentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:saveDepartment',
					params: [
						departmentId,
						{
							enabled: true,
							email: faker.internet.email(),
							showOnRegistration: true,
							showOnOfflineForm: true,
							name: name || `new department ${Date.now()}`,
							description: 'created from api',
							allowReceiveForwardOffline,
							fallbackForwardDepartment,
							departmentsAllowedToForward,
						},
						initialAgents,
						departmentUnit,
					],
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

type OnlineAgent = {
	user: WithRequiredProperty<IUser, 'username'>;
	credentials: Credentials;
};

export const createDepartmentWithAnOnlineAgent = async (): Promise<{ department: ILivechatDepartment; agent: OnlineAgent }> => {
	const { user, credentials } = await createAnOnlineAgent();

	const department = await createDepartmentWithMethod();

	await addOrRemoveAgentFromDepartment(department._id, { agentId: user._id, username: user.username }, true);

	return {
		department,
		agent: {
			credentials,
			user,
		},
	};
};

export const createDepartmentWithAgent = async (agent: OnlineAgent): Promise<{ department: ILivechatDepartment; agent: OnlineAgent }> => {
	const { user, credentials } = agent;
	const department = await createDepartmentWithMethod();

	await addOrRemoveAgentFromDepartment(department._id, { agentId: user._id, username: user.username }, true);

	return {
		department,
		agent: {
			credentials,
			user,
		},
	};
};

export const addOrRemoveAgentFromDepartment = async (
	departmentId: string,
	agent: { agentId: string; username: string; count?: number; order?: number },
	add: boolean,
) => {
	const response = await request
		.post(api(`livechat/department/${departmentId}/agents`))
		.set(credentials)
		.send({
			...(add ? { upsert: [agent], remove: [] } : { remove: [agent], upsert: [] }),
		});

	if (response.status !== 200) {
		throw new Error(`Failed to add or remove agent from department. Status code: ${response.status}\n${response.body}`);
	}
};

export const createDepartmentWithAnOfflineAgent = async ({
	allowReceiveForwardOffline = false,
	fallbackForwardDepartment,
	departmentsAllowedToForward,
}: {
	allowReceiveForwardOffline?: boolean;
	fallbackForwardDepartment?: string;
	departmentsAllowedToForward?: string[];
}): Promise<{
	department: ILivechatDepartment;
	agent: {
		credentials: Credentials;
		user: WithRequiredProperty<IUser, 'username'>;
	};
}> => {
	const { user, credentials } = await createAnOfflineAgent();

	const department = (await createDepartmentWithMethod({
		allowReceiveForwardOffline,
		fallbackForwardDepartment,
		departmentsAllowedToForward,
	})) as ILivechatDepartment;

	await addOrRemoveAgentFromDepartment(department._id, { agentId: user._id, username: user.username }, true);

	return {
		department,
		agent: {
			credentials,
			user,
		},
	};
};

export const archiveDepartment = async (departmentId: string): Promise<void> => {
	await request
		.post(api(`livechat/department/${departmentId}/archive`))
		.set(credentials)
		.expect(200);
};

export const disableDepartment = async (department: ILivechatDepartment): Promise<void> => {
	department.enabled = false;
	delete department._updatedAt;
	const updatedDepartment = await updateDepartment(department._id, department);
	expect(updatedDepartment.enabled).to.be.false;
};

export const deleteDepartment = async (departmentId: string): Promise<void> => {
	await request
		.delete(api(`livechat/department/${departmentId}`))
		.set(credentials)
		.expect(200);
};

export const getDepartmentById = async (departmentId: string): Promise<ILivechatDepartment> => {
	const response = await request
		.get(api(`livechat/department/${departmentId}`))
		.set(credentials)
		.expect(200);
	return response.body.department;
};
