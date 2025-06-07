import type { IFreeSwitchEventCallUser } from '@rocket.chat/core-typings';

import { isSameUser } from './isSameUser';
import { mergeUsers } from './mergeUsers';

export function addOrMergeUserIntoList(user: IFreeSwitchEventCallUser, list: IFreeSwitchEventCallUser[]): void {
	if (!user.uid && !user.identifiers?.length) {
		return;
	}

	for (const listUser of list) {
		if (!isSameUser(user, listUser)) {
			continue;
		}

		const newUser = mergeUsers(listUser, user, false);
		list[list.indexOf(listUser)] = newUser;
		return;
	}

	list.push(user);
}
