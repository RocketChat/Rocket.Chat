import { useUser, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

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

	return useQuery<RoomMessageUser[]>({
		queryKey: roomMessageUsersQueryKeys.all(rid, uid),
		queryFn: async () => {
			if (!rid || !user?.username) {
				return [];
			}

			const messages = Messages.find(
				{
					rid,
					'u.username': { $ne: user?.username },
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
		},
		enabled: Boolean(rid && uid),
	});
};
