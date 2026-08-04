import { usePermission, useUserId } from '@rocket.chat/ui-contexts';
import { parse, endOfDay, startOfDay } from 'date-fns';
import { useCallback } from 'react';

import type { ChatsFiltersQuery } from '../../contexts/ChatsContext';

type CurrentChatQuery = {
	agents?: string[];
	offset?: number;
	roomName?: string;
	departmentId?: string[];
	open?: boolean;
	createdAt?: string;
	closedAt?: string;
	tags?: string[];
	onhold?: boolean;
	customFields?: string;
	sort: string;
	count?: number;
	queued?: boolean;
	units?: string[];
};

const sortDir = (sortDir: 'asc' | 'desc'): 1 | -1 => (sortDir === 'asc' ? 1 : -1);

export const useChatsQuery = () => {
	const userIdLoggedIn = useUserId();
	const canViewLivechatRooms = usePermission('view-livechat-rooms');

	return useCallback(
		(
			{ guest, servedBy, department, status, from, to, tags, units, ...customFields }: ChatsFiltersQuery,
			[column, direction]: [string, 'asc' | 'desc'],
			current: number,
			itemsPerPage: 25 | 50 | 100,
		) => {
			const query: CurrentChatQuery = {
				...(guest && { roomName: guest }),
				sort: JSON.stringify({
					[column]: sortDir(direction),
					ts: column === 'ts' ? sortDir(direction) : undefined,
				}),
				...(itemsPerPage && { count: itemsPerPage }),
				...(current && { offset: current }),
			};

			if (from || to) {
				query.createdAt = JSON.stringify({
					...(from && {
						start: startOfDay(parse(from, 'yyyy-MM-dd', new Date())).toISOString(),
					}),
					...(to && {
						end: endOfDay(parse(to, 'yyyy-MM-dd', new Date())).toISOString(),
					}),
				});
			}

			if (status !== 'all') {
				query.open = status === 'opened' || status === 'onhold' || status === 'queued';
				query.onhold = status === 'onhold';
				query.queued = status === 'queued';
			}

			if (!canViewLivechatRooms) {
				query.agents = userIdLoggedIn ? [userIdLoggedIn] : [];
			}

			if (canViewLivechatRooms && servedBy?.length) {
				query.agents = servedBy.map((s) => s.value as string);
			}

			if (department?.length) {
				query.departmentId = department.map((d) => d.value as string);
			}

			if (tags && tags.length > 0) {
				query.tags = tags.map((tag) => tag.value);
			}

			if (units?.length) {
				query.units = units.map((u) => u.value as string);
			}

			if (customFields && Object.keys(customFields).length > 0) {
				const customFieldsQuery = Object.fromEntries(
					Object.entries(customFields).filter((item) => item[1] !== undefined && item[1] !== ''),
				);
				if (Object.keys(customFieldsQuery).length > 0) {
					query.customFields = JSON.stringify(customFieldsQuery);
				}
			}

			return query;
		},
		[canViewLivechatRooms, userIdLoggedIn],
	);
};
