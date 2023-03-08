import { Meteor } from 'meteor/meteor';
import type { IUser } from '@rocket.chat/core-typings';
import type { FindCursor } from 'mongodb';
import type { FindPaginated } from '@rocket.chat/model-typings';
import { Users } from '@rocket.chat/models';

import { settings } from '../../app/settings/server';
import { shouldUseRealName } from '../../app/utils/lib/shouldUseRealName';

type FindUsersParam = {
	rid: string;
	status?: string;
	skip?: number;
	limit?: number;
	filter?: string;
	sort?: Record<string, any>;
};

export async function findUsersOfRoom({
	rid,
	status,
	skip = 0,
	limit = 0,
	filter = '',
	sort = {},
}: FindUsersParam): Promise<FindPaginated<FindCursor<IUser>>> {
	const uid = Meteor.userId();
	const user = uid ? await Users.findOneById(uid, { projection: { settings: 1 } }) : undefined;
	const defaultMessagesLayout = settings.get<string>('Accounts_Default_User_Preferences_messagesLayout');
	const key = shouldUseRealName(defaultMessagesLayout, user) ? 'name' : 'username';

	const options = {
		projection: {
			name: 1,
			username: 1,
			nickname: 1,
			status: 1,
			avatarETag: 1,
			_updatedAt: 1,
			federated: 1,
		},
		sort: {
			statusConnection: -1,
			...(sort || { [key]: 1 }),
		},
		...(skip > 0 && { skip }),
		...(limit > 0 && { limit }),
	};

	const searchFields = settings.get<string>('Accounts_SearchFields').trim().split(',');

	return Users.findPaginatedByActiveUsersExcept(filter, undefined, options, searchFields, [
		{
			__rooms: rid,
			...(status && { status }),
		},
	]);
}
