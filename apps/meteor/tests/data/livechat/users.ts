import { faker } from '@faker-js/faker';
import type { Credentials } from '@rocket.chat/api-client';
import { UserStatus, type ILivechatAgent, type IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';

import { api, credentials, request } from '../api-data';
import { password } from '../user';
import { createUser, login, setUserAway, setUserStatus } from '../users.helper';
import { createAgent, makeAgentAvailable, makeAgentUnavailable } from './rooms';

export const createBotAgent = async (): Promise<{
	credentials: Credentials;
	user: IUser;
}> => {
	const agent = await createUser({
		roles: ['bot'],
	});
	const createdUserCredentials = await login(agent.username, password);
	await createAgent(agent.username);
	await makeAgentAvailable(createdUserCredentials);

	return {
		credentials: createdUserCredentials,
		user: agent,
	};
};

export const getRandomVisitorToken = (): string => faker.string.alphanumeric(17);

export const getAgent = async (userId: string): Promise<ILivechatAgent> => {
	const { body } = await request
		.get(api(`livechat/users/agent/${userId}`))
		.set(credentials)
		.expect(200);
	return body.user;
};

export const removeAgent = async (userId: string): Promise<void> => {
	await request
		.delete(api(`livechat/users/agent/${userId}`))
		.set(credentials)
		.expect(200);
};

export const createAnOnlineAgent = async (): Promise<{
	credentials: Credentials;
	user: IUser & { username: string };
}> => {
	const username = `user.test.${Random.id()}`;
	const email = `${username}@rocket.chat`;
	const { body } = await request.post(api('users.create')).set(credentials).send({ email, name: username, username, password });
	const agent = body.user;
	const createdUserCredentials = await login(agent.username, password);
	await createAgent(agent.username);
	await makeAgentAvailable(createdUserCredentials);

	return {
		credentials: createdUserCredentials,
		user: agent,
	};
};

export const createAnOfflineAgent = async (): Promise<{
	credentials: Credentials;
	user: IUser & { username: string };
}> => {
	const username = `user.test.${Date.now()}.offline`;
	const email = `${username}.offline@rocket.chat`;
	const { body } = await request.post(api('users.create')).set(credentials).send({ email, name: username, username, password });
	const agent = body.user;
	const createdUserCredentials = await login(agent.username, password);
	await createAgent(agent.username);
	await makeAgentUnavailable(createdUserCredentials);

	return {
		credentials: createdUserCredentials,
		user: agent,
	};
};

export const createAnAwayAgent = async (): Promise<{
	credentials: Credentials;
	user: IUser & { username: string };
}> => {
	const username = `user.test.${Date.now()}.away`;
	const email = `${username}.offline@rocket.chat`;
	const { body } = await request.post(api('users.create')).set(credentials).send({ email, name: username, username, password });
	const agent = body.user;
	const createdUserCredentials = await login(agent.username, password);
	await createAgent(agent.username);
	await makeAgentAvailable(createdUserCredentials);
	await setUserStatus(createdUserCredentials, UserStatus.AWAY);
	await setUserAway(createdUserCredentials);

	return {
		credentials: createdUserCredentials,
		user: agent,
	};
};

export const updateLivechatSettingsForUser = async (
	agentId: string,
	livechatSettings: Record<string, any>,
	agentDepartments: string[] = [],
): Promise<void> => {
	await request
		.post(api('livechat/agents.saveInfo'))
		.set(credentials)
		.send({
			agentId,
			agentData: livechatSettings,
			agentDepartments,
		})
		.expect('Content-Type', 'application/json')
		.expect(200);
};
