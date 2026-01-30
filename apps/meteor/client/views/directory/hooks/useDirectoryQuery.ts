import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useMemo } from 'react';

export function useDirectoryQuery(
	{ text, itemsPerPage, current }: { text: string; current: number; itemsPerPage: number },
	[column, direction]: [string, 'asc' | 'desc'],
	type: string,
	workspace = 'local',
): { sort: string; offset?: number | undefined; count?: number; query?: string; text?: string; type?: string; workspace?: string } {
	return useDebouncedValue(
		useMemo(
			() => ({
				text,
				type,
				workspace,
				sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
				...(itemsPerPage && { count: itemsPerPage }),
				...(current && { offset: current }),
			}),
			[itemsPerPage, current, column, direction, type, workspace, text],
		),
		500,
	);
}
