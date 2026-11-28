import type { ContactsSortableField } from '@rocket.chat/rest-typings';

export const contactsQueryKeys = {
	all: ['contacts'] as const,
	list: (
		...args: [
			query?: {
				sortBy: ContactsSortableField;
				sortDirection: 'asc' | 'desc';
				offset: number;
				count: number;
				text?: string;
				favorite?: boolean;
			},
		]
	) => [...contactsQueryKeys.all, 'list', ...args] as const,
	info: (contactId: string) => [...contactsQueryKeys.all, 'info', contactId] as const,
};
