import type { IUser } from '@rocket.chat/core-typings';

const held = new Set<string>();

export const acquireMailbox = (scope: 'calendar' | 'contacts', uid: IUser['_id']): (() => void) | undefined => {
	const key = `${scope}:${uid}`;

	if (held.has(key)) {
		return undefined;
	}

	held.add(key);

	return () => held.delete(key);
};
