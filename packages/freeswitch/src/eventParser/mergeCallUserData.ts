import type { IFreeSwitchEventCallUser } from '@rocket.chat/core-typings';

import { addOrMergeUserIntoList } from './addOrMergeUserIntoList';

export function mergeCallUserData(users: (IFreeSwitchEventCallUser | undefined)[]): IFreeSwitchEventCallUser[] {
	const list: IFreeSwitchEventCallUser[] = [];

	for (const user of users) {
		if (!user) {
			continue;
		}

		addOrMergeUserIntoList(user, list);
	}

	return list;
}
