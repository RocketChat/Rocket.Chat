import { useUser, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { Messages } from '../../../../app/models/client';
import { roomMessageUsersQueryKeys } from '../../../lib/queryKeys';
import { useRoom } from '../../room/contexts/RoomContext';

export type RoomMessageUser = {
	_id: string;
	username: string;
	name?: string;
	ts: Date;
	suggestion?: boolean;
};

export const useRoomMessageUsers = () => {
	const uid = useUserId();
	const user = useUser();
	const rid = useRoom()._id;

	const queryParams = useMemo(
		() => ({
			rid,
			username: user?.username,
		}),
		[rid, user?.username],
	);

	const fetchRoomMessageUsers = useCallback(async (): Promise<RoomMessageUser[]> => {
		if (!queryParams.rid || !queryParams.username) {
			return [];
		}

		const messages = Messages.find(
			{
				rid,
				'u.username': { $ne: queryParams.username },
				't': { $exists: false },
				'ts': { $exists: true },
			},
			{
				fields: {
					'u.username': 1,
					'u.name': 1,
					'u._id': 1,
					'ts': 1,
				},
				sort: { ts: -1 },
			},
		).fetch();

		const uniqueUsers = new Map<string, RoomMessageUser>();

		messages.forEach(({ u: { username, name, _id }, ts }) => {
			if (!uniqueUsers.has(username)) {
				uniqueUsers.set(username, {
					_id,
					username,
					name,
					ts,
				});
			}
		});

		return Array.from(uniqueUsers.values());
	}, [queryParams.rid, queryParams.username, rid]);

	return useQuery<RoomMessageUser[]>({
		queryKey: roomMessageUsersQueryKeys.all(rid, uid),
		queryFn: fetchRoomMessageUsers,
		enabled: Boolean(rid && uid),
	});
};
