import type { IUser } from '@rocket.chat/core-typings';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { useMethod, useToastMessageDispatch, useTranslation, useUserRoom } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

type MembersListQueryDataType = {
	pages: {
		count: number;
		offset: number;
		members: (IUser & { isMuted: boolean })[];
		total: number;
	}[];
};

export const useMuteUserMutation = (isUserMuted: boolean, rid: string) => {
	const muteUser = useMethod(isUserMuted ? 'unmuteUserInRoom' : 'muteUserInRoom');
	const room = useUserRoom(rid);
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const queryClient = useQueryClient();

	const dispatchMessage = isUserMuted ? 'User__username__unmuted_in_room__roomName__' : 'User__username__muted_in_room__roomName__';

	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));

	return useMutation(
		async ({ username, rid }: { username: string; rid: string }) => {
			return muteUser({ username, rid });
		},
		{
			onSuccess: (_data, { username }) => {
				dispatchToastMessage({
					type: 'success',
					message: t(dispatchMessage, { username, roomName }),
				});

				queryClient.setQueriesData<MembersListQueryDataType>(
					{
						predicate: (query) => query.queryKey[1] === 'members' && query.queryKey[2] === rid,
					},
					(data) =>
						data && {
							...data,
							pages: data.pages.map((page) => ({
								...page,
								members: page.members.map((member) =>
									member.username === username ? { ...member, isMuted: !isUserMuted } : { ...member },
								),
							})),
						},
				);
			},
			onError: (error) => {
				dispatchToastMessage({
					type: 'error',
					message: error,
				});
			},
		},
	);
};
