import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { ChatRoom } from '../../../../../app/models/client';

const sortRoomByLastMessage = (a: IRoom, b: IRoom) => {
	if (!a.lm) {
		return 1;
	}
	if (!b.lm) {
		return -1;
	}
	return new Date(b.lm).toUTCString().localeCompare(new Date(a.lm).toUTCString());
};

export const useTeamsListChildrenUpdate = (
	parentRid: string,
	teamId?: string | null,
	sidepanelItems?: 'channels' | 'discussions' | null,
) => {
	const queryClient = useQueryClient();

	const query = useMemo(() => {
		const query: Parameters<typeof ChatRoom.find>[0] = {
			$or: [
				{
					_id: parentRid,
				},
				{
					prid: parentRid,
				},
			],
		};

		if (teamId && query.$or) {
			query.$or.push({
				teamId,
			});
		}
		return query;
	}, [parentRid, teamId]);

	const teamList = useEndpoint('GET', '/v1/teams.listChildren');

	const listRoomsAndDiscussions = useEndpoint('GET', '/v1/teams.listChildren');
	const result = useQuery({
		queryKey: ['sidepanel', 'list', parentRid, sidepanelItems],
		queryFn: () =>
			listRoomsAndDiscussions({
				roomId: parentRid,
				sort: JSON.stringify({ lm: -1 }),
				type: sidepanelItems || undefined,
			}),
		enabled: sidepanelItems !== null && teamId !== null,
		refetchInterval: 5 * 60 * 1000,
		keepPreviousData: true,
	});

	const { mutate: update } = useMutation({
		mutationFn: async (params?: { action: 'add' | 'remove' | 'update'; data: IRoom }) => {
			queryClient.setQueryData(['sidepanel', 'list', parentRid, sidepanelItems], (data: Awaited<ReturnType<typeof teamList>> | void) => {
				if (!data) {
					return;
				}

				if (params?.action === 'add') {
					data.data = [JSON.parse(JSON.stringify(params.data)), ...data.data].sort(sortRoomByLastMessage);
				}

				if (params?.action === 'remove') {
					data.data = data.data.filter((item) => item._id !== params.data?._id);
				}

				if (params?.action === 'update') {
					data.data = data.data
						.map((item) => (item._id === params.data?._id ? JSON.parse(JSON.stringify(params.data)) : item))
						.sort(sortRoomByLastMessage);
				}

				return { ...data };
			});
		},
	});

	useEffect(() => {
		const liveQueryHandle = ChatRoom.find(query).observe({
			added: (item) => {
				queueMicrotask(() => update({ action: 'add', data: item }));
			},
			changed: (item) => {
				queueMicrotask(() => update({ action: 'update', data: item }));
			},
			removed: (item) => {
				queueMicrotask(() => update({ action: 'remove', data: item }));
			},
		});

		return () => {
			liveQueryHandle.stop();
		};
	}, [update, query]);

	return result;
};
