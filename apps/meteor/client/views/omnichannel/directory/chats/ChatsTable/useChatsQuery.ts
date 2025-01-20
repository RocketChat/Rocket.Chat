import { usePermission, useUserId } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import { useCallback } from 'react';

import type { ChatsFiltersQuery } from '../../contexts/ChatsContext';

type CurrentChatQuery = {
	agents?: string[];
	offset?: number;
	roomName?: string;
	departmentId?: string;
	open?: boolean;
	createdAt?: string;
	closedAt?: string;
	tags?: string[];
	onhold?: boolean;
	customFields?: string;
	sort: string;
	count?: number;
	queued?: boolean;
};

const sortDir = (sortDir: 'asc' | 'desc'): 1 | -1 => (sortDir === 'asc' ? 1 : -1);

export const useChatsQuery = () => {
	const userIdLoggedIn = useUserId();
	const canViewLivechatRooms = usePermission('view-livechat-rooms');

	return useCallback(
		(
			{ guest, servedBy, department, status, from, to, tags, ...customFields }: ChatsFiltersQuery,
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
						start: moment(new Date(from)).set({ hour: 0, minutes: 0, seconds: 0 }).toISOString(),
					}),
					...(to && {
						end: moment(new Date(to)).set({ hour: 23, minutes: 59, seconds: 59 }).toISOString(),
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

			if (canViewLivechatRooms && servedBy && servedBy !== 'all') {
				query.agents = [servedBy];
			}

			if (department && department !== 'all') {
				query.departmentId = department;
			}

			if (tags && tags.length > 0) {
				query.tags = tags.map((tag) => tag.value);
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
