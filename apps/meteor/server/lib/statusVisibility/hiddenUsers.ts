import { StatusVisibility } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';

import { redactStatus } from './redactStatus';
import { settings } from '../../settings';

export const getUsersHiddenFrom = async (viewerId: IUser['_id'] | null | undefined): Promise<Set<IUser['_id']> | undefined> => {
	if (!settings.get<boolean>('Accounts_StatusVisibility_Enabled')) {
		return undefined;
	}

	const hidden = await StatusVisibility.getHiddenFrom(viewerId);

	return hidden.length ? new Set(hidden) : undefined;
};

export const filterHiddenUsers = <T extends Pick<IUser, '_id'>>(users: T[], hidden?: Set<IUser['_id']>): T[] =>
	hidden ? users.filter((user) => !hidden.has(user._id)) : users;

export const redactHiddenUsers = <T extends Pick<IUser, '_id'>>(users: T[], hidden?: Set<IUser['_id']>): T[] =>
	hidden ? users.map((user) => (hidden.has(user._id) ? redactStatus(user) : user)) : users;
