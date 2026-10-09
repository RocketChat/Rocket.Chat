import type { IUser } from '@rocket.chat/core-typings';

const held = new Set<IUser['_id']>();

export const acquireMailbox = (uid: IUser['_id']): (() => void) | undefined => {
	if (held.has(uid)) {
		return undefined;
	}

	held.add(uid);

	return () => held.delete(uid);
};
