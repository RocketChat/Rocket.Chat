import type { AbacActor } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';

// The actor crosses the service broker, so only these fields leave the process, never `services`.
export const toAbacActor = ({ _id, username, name }: Pick<IUser, '_id' | 'username' | 'name'>): AbacActor => {
	if (!username) {
		throw new Error('error-invalid-user');
	}

	return { _id, username, name };
};
