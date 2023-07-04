import { faker } from "@faker-js/faker";
import type { IUser } from "@rocket.chat/core-typings";
import { password } from "../user";
import { createUser, login } from "../users.helper";
import { createAgent, makeAgentAvailable } from "./rooms";
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

export const removeAgent = async (userId: string): Promise<void> => {
    await request.delete(api(`livechat/users/agent/${userId}`))
        .set(credentials)
        .expect(200);
}
