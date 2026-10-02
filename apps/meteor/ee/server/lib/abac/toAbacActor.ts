import type { AbacActor } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';

// The actor crosses the service broker, so only these fields leave the process, never `services`.
export const toAbacActor = ({ _id, username, name }: Pick<IUser, '_id' | 'username' | 'name'>): AbacActor => ({ _id, username, name });
