import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { PaginatedRequest } from '@rocket.chat/rest-typings';
import { useMemo } from 'react';

const sortDir = (sortDir: 'asc' | 'desc'): 1 | -1 => (sortDir === 'asc' ? 1 : -1);

export const useQuery = (
	{
		text,
		itemsPerPage,
		current,
	}: {
		text: string;
		itemsPerPage: number;
		current: number;
	},
	[column, direction]: [string, 'asc' | 'desc'],
): PaginatedRequest<{ text: string }> =>
	useDebouncedValue(
		useMemo(
			() => ({
				text,
				sort: JSON.stringify({
					[column]: sortDir(direction),
					usernames: column === 'name' ? sortDir(direction) : undefined,
				}),
				...(itemsPerPage && { count: itemsPerPage }),
				...(current && { offset: current }),
			}),
			[text, itemsPerPage, current, column, direction],
		),
		500,
	);
