import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { PaginatedRequest } from '@rocket.chat/rest-typings';
import { useMemo } from 'react';

const sortDir = (sortDir: 'asc' | 'desc'): 1 | -1 => (sortDir === 'asc' ? 1 : -1);

export const useQuery = (
	{
		text,
	}: {
		text: string;
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
			}),
			[text, column, direction],
		),
		500,
	);
