import type { IFreeSwitchEventCallUser, IFreeSwitchEventUser } from '@rocket.chat/core-typings';

import { makeEventUser } from './makeEventUser';

export function isSameUser(user1: IFreeSwitchEventCallUser, user2: IFreeSwitchEventCallUser, strict = true): boolean {
	if (user1.workspaceUrl && user2.workspaceUrl && user1.workspaceUrl !== user2.workspaceUrl) {
		return false;
	}

	if (user1.uid && user1.uid === user2.uid) {
		return true;
	}

	const user1Identifiers = [...user1.identifiers, makeEventUser('uid', user1.uid)].filter((u) => u) as IFreeSwitchEventUser[];
	const user2Identifiers = [...user2.identifiers, makeEventUser('uid', user2.uid)].filter((u) => u) as IFreeSwitchEventUser[];

	for (const identifier of user1Identifiers) {
		if (identifier.type === 'voicemail' || identifier.value === 'voicemail') {
			continue;
		}

		if (user2Identifiers.some((id) => id.value === identifier.value && (!strict || id.type === identifier.type))) {
			return true;
		}

		if (identifier.type === 'extension' && user2Identifiers.some((id) => id.type === 'extension')) {
			return false;
		}
	}

	return false;
}
