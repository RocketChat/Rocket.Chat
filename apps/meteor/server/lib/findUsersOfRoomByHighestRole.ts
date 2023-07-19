import type { IUser } from '@rocket.chat/core-typings';
import type { FilterOperators, FindCursor } from 'mongodb';
import type { FindPaginated } from '@rocket.chat/model-typings';
import { Users, Subscriptions } from '@rocket.chat/models';
import { compact } from 'lodash';

import { settings } from '../../app/settings/server';

type FindUsersParam = {
	rid: string;
	role?: string;
	status?: FilterOperators<string>;
	skip?: number;
	limit?: number;
	filter?: string;
	sort?: Record<string, any>;
};

export async function findUsersOfRoomByHighestRole({
	rid,
	role = '',
	status,
	skip = 0,
	limit = 0,
	filter = '',
	sort,
}: FindUsersParam): Promise<FindPaginated<FindCursor<IUser>>> {
	const subscriptions = await Subscriptions.findUsersByHighestRole(rid, role).toArray();
	const uids = compact(subscriptions.map((subscription) => subscription.u?._id).filter(Boolean));

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
			...(sort || { ...(settings.get('UI_Use_Real_Name') && { name: 1 }), username: 1 }),
		},
		...(skip > 0 && { skip }),
		...(limit > 0 && { limit }),
	};

	const searchFields = settings.get<string>('Accounts_SearchFields').trim().split(',');

	return Users.findPaginatedByActiveUsersExcept(filter, undefined, options, searchFields, [
		{
			_id: { $in: uids },
			...(status && { status }),
		},
	]);
}
