import { faker } from "@faker-js/faker";
import type { ILivechatAgent, IUser } from "@rocket.chat/core-typings";
import { IUserCredentialsHeader, password } from "../user";
import { createUser, login } from "../users.helper";
import { createAgent, makeAgentAvailable, makeAgentUnavailable } from "./rooms";
import { api, credentials, request } from "../api-data";

export const createBotAgent = async (): Promise<{
	credentials: { 'X-Auth-Token': string; 'X-User-Id': string; };
	user: IUser;
}> => {
    const agent: IUser = await createUser({
        roles: ['bot']
    });
	const createdUserCredentials = await login(agent.username, password);
	await createAgent(agent.username);
	await makeAgentAvailable(createdUserCredentials);

    return {
        credentials: createdUserCredentials,
        user: agent,
    };
}

export const getRandomVisitorToken = (): string => faker.string.alphanumeric(17);

export const getAgent = async (userId: string): Promise<ILivechatAgent> => {
    const { body } = await request.get(api(`livechat/users/agent/${userId}`))
        .set(credentials)
        .expect(200);
    return body.user;
}

export const removeAgent = async (userId: string): Promise<void> => {
    await request.delete(api(`livechat/users/agent/${userId}`))
        .set(credentials)
        .expect(200);
}

export const createAnOnlineAgent = async (): Promise<{
        credentials: IUserCredentialsHeader;
        user: IUser & { username: string };
}> => {
    const username = `user.test.${Date.now()}`;
    const email = `${username}@rocket.chat`;
    const { body } = await request
            .post(api('users.create'))
            .set(credentials)
            .send({ email, name: username, username, password });
    const agent = body.user;
    const createdUserCredentials = await login(agent.username, password);
    await createAgent(agent.username);
    await makeAgentAvailable(createdUserCredentials);

    return {
        credentials: createdUserCredentials,
        user: agent,
    };
}

export const createAnOfflineAgent = async (): Promise<{
	credentials: IUserCredentialsHeader;
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