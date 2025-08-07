import type { Serialized } from '@rocket.chat/core-typings';
import type { ILivechatContactWithManagerData } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

import { omnichannelQueryKeys } from '../../lib/queryKeys';

export type ContactOption = Serialized<ILivechatContactWithManagerData> & {
	value: string;
	label: string;
};

type ContactOptions = {
	filter: string;
	limit?: number;
};

const DEFAULT_QUERY_LIMIT = 25;

const formatContactItem = (contact: Serialized<ILivechatContactWithManagerData>): ContactOption => ({
	...contact,
	label: contact.name || contact._id,
	value: contact._id,
});

export const useContactsList = (options: ContactOptions) => {
	const getContacts = useEndpoint('GET', '/v1/omnichannel/contacts.search');
	const { filter, limit = DEFAULT_QUERY_LIMIT } = options;

	return useInfiniteQuery({
		queryKey: omnichannelQueryKeys.contactSearch({ filter, limit }),
		queryFn: async ({ pageParam: offset = 0 }) => {
			const { contacts, ...data } = await getContacts({
				searchText: filter,
				// sort: `{ name: -1 }`,
				...(limit && { count: limit }),
				...(offset && { offset }),
			});

			return {
				...data,
				contacts: contacts.map(formatContactItem),
			};
		},
		select: (data) => data.pages.flatMap<ContactOption>((page) => page.contacts),
		initialPageParam: 0,
		getNextPageParam: (lastPage) => {
			const offset = lastPage.offset + lastPage.count;
			return offset < lastPage.total ? offset : undefined;
		},
	});
};
