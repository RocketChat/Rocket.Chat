import type { IAiEngine, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';

export const MAX_BOTS_RESERVED_AT_ONCE = 10;

const USERNAME_PREFIX = 'ai-agent-';
const USERNAME_ATTEMPTS = 3;

export type ReservedAgentBot = Pick<IUser, '_id'> & { username: string };

const pickFreeUsername = async (): Promise<string> => {
	for (let attempt = 0; attempt < USERNAME_ATTEMPTS; attempt++) {
		const username = `${USERNAME_PREFIX}${Random.id(10).toLowerCase()}`;
		if (!(await Users.findOneByUsernameIgnoringCase(username, { projection: { _id: 1 } }))) {
			return username;
		}
	}
	throw new Error('error-reserved-bot-username-unavailable');
};

/**
 * Creates `count` bot users for the seats of one engine. They start inactive, with no password, login token or email,
 * and join no room; the operator binds each one to a seat in the engine's own manifest.
 */
export const reserveAgentBots = async (engineId: IAiEngine['_id'], count: number, now = new Date()): Promise<ReservedAgentBot[]> => {
	if (!Number.isInteger(count) || count < 1 || count > MAX_BOTS_RESERVED_AT_ONCE) {
		throw new Error('error-invalid-reserved-bot-count');
	}

	const bots: ReservedAgentBot[] = [];
	for (let i = 0; i < count; i++) {
		const username = await pickFreeUsername();
		const { insertedId } = await Users.insertReservedAgentBot({ username, name: username, engineId, createdAt: now });
		bots.push({ _id: insertedId, username });
	}

	return bots;
};
