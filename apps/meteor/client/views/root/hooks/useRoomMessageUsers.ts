import { useUser } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { Messages } from '../../../../app/models/client';
import { roomMessageUsersQueryKeys } from '../../../lib/queryKeys';

export type RoomMessageUser = {
	_id: string;
	username: string;
	name?: string;
	ts: Date;
	suggestion?: boolean;
};

export const useRoomMessageUsers = (uid: string, rid: string) => {
	const user = useUser();

	const username = user?.username;

	return useQuery<RoomMessageUser[]>({
		queryKey: roomMessageUsersQueryKeys.all(rid, uid),
		staleTime: 0,
		queryFn: async () => {
			const messages = Messages.find(
				{
					rid,
					'u.username': { $ne: username },
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
		enabled: Boolean(rid && uid && username),
	});
};
