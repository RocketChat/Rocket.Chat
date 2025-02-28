import type { IFreeSwitchEventCallUser } from '@rocket.chat/core-typings';

import { isSameUser } from './isSameUser';
import { mergeUsers } from './mergeUsers';

export function insertDataIntoExistingUsers(data: IFreeSwitchEventCallUser, list: IFreeSwitchEventCallUser[]): void {
	if (!data.uid && !data.identifiers?.length) {
		return;
	}

	for (const listUser of list) {
		if (!isSameUser(data, listUser)) {
			continue;
		}

		mergeUsers(listUser, data, true);
	}
}
