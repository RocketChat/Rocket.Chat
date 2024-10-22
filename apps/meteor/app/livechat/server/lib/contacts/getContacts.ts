import type { ILivechatContact } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { Sort } from 'mongodb';

export type GetContactsParams = {
	searchText?: string;
	count: number;
	offset: number;
	sort: Sort;
};

export async function getContacts(params: GetContactsParams): Promise<PaginatedResult<{ contacts: ILivechatContact[] }>> {
	const { searchText, count, offset, sort } = params;

	const { cursor, totalCount } = LivechatContacts.findPaginatedContacts(searchText, {
		limit: count,
		skip: offset,
		sort: sort ?? { name: 1 },
	});

	const [contacts, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		contacts,
		count,
		offset,
		total,
	};
}
