import type { Serialized } from '@rocket.chat/core-typings';
import type { ILivechatContactWithManagerData } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

type ContactOptions = {
	filter: string;
	limit?: number;
	optionFormatter?(contact: Serialized<ILivechatContactWithManagerData>): { value: string; label: string };
};

export type ContactOption = {
	value: string;
	label: string;
};

const DEFAULT_QUERY_LIMIT = 25;

const formatContactItem = (contact: Serialized<ILivechatContactWithManagerData>) => ({
	...contact,
	label: contact.name || contact._id,
	value: contact._id,
});

export const useContactsList = (options: ContactOptions) => {
	const getContacts = useEndpoint('GET', '/v1/omnichannel/contacts.search');
	const { filter, limit = DEFAULT_QUERY_LIMIT, optionFormatter = formatContactItem } = options;

	return useInfiniteQuery({
		queryKey: ['/v1/omnichannel/contacts.search', { filter }],
		queryFn: async ({ pageParam: offset = 0 }) => {
			const { contacts, ...data } = await getContacts({
				searchText: filter,
				// sort: `{ name: -1 }`,
				...(limit && { count: limit }),
				...(offset && { offset }),
			});

			return {
				...data,
				contacts: contacts.map(optionFormatter),
			};
		},
		select: (data) => data.pages.flatMap<ContactOption>((page) => page.contacts),
		initialPageParam: 0,
		getNextPageParam: (lastPage) => {
			const offset = lastPage.offset + lastPage.count;
			return offset < lastPage.total ? offset : undefined;
		},
		initialData: () => ({
			pages: [{ contacts: [], offset: 0, count: 0, total: Infinity }],
			pageParams: [0],
		}),
	});
};
