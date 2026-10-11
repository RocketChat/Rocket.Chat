import type { IUser } from '@rocket.chat/core-typings';
import { isNotUndefined } from '@rocket.chat/core-typings';
import { LivechatContacts, Users } from '@rocket.chat/models';
import type { PaginatedResult, ILivechatContactWithManagerData } from '@rocket.chat/rest-typings';
import type { FindCursor, Sort } from 'mongodb';

export type GetContactsParams = {
	searchText?: string;
	count: number;
	offset: number;
	sort: Sort;
	unknown?: boolean;
};

export async function getContacts(params: GetContactsParams): Promise<PaginatedResult<{ contacts: ILivechatContactWithManagerData[] }>> {
	const { searchText, count, offset, sort, unknown } = params;

	const { cursor, totalCount } = LivechatContacts.findPaginatedContacts(
		{ searchText, unknown },
		{
			limit: count,
			skip: offset,
			sort: sort ?? { name: 1 },
		},
	);

	const [rawContacts, total] = await Promise.all([cursor.toArray(), totalCount]);

	const managerIds = [...new Set(rawContacts.map(({ contactManager }) => contactManager))].filter(isNotUndefined);
	const managersCursor: FindCursor<[string, Pick<IUser, '_id' | 'name' | 'username'>]> = Users.findByIds(managerIds, {
		projection: { name: 1, username: 1 },
	}).map((manager) => [manager._id, manager]);
	const managersData = await managersCursor.toArray();
	const mappedManagers = Object.fromEntries(managersData);

	const contacts: ILivechatContactWithManagerData[] = rawContacts.map((contact) => {
		const { contactManager, ...data } = contact;

		return {
			...data,
			...(contactManager ? { contactManager: mappedManagers[contactManager] } : {}),
		};
	});

	return {
		contacts,
		count,
		offset,
		total,
	};
}
