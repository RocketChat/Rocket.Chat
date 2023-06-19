import faker from "@faker-js/faker";
import type { IUser } from "@rocket.chat/core-typings";
import { password } from "../user";
import { createUser, login } from "../users.helper";
import { createAgent, makeAgentAvailable } from "./rooms";

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

export const getRandomVisitorToken = (): string => faker.random.alphaNumeric(17);

