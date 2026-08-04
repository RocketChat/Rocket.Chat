import { escapeHTML } from '@rocket.chat/string-helpers';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch, useUserRoom } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { roomsQueryKeys } from '../../../lib/queryKeys';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

type UseUnbanUserProps = {
	roomId: string;
};

export const useUnbanUser = ({ roomId }: UseUnbanUserProps) => {
	const { t } = useTranslation();
	const room = useUserRoom(roomId);
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const unbanUserEndpoint = useEndpoint('POST', '/v1/rooms.unbanUser');

	if (!room) {
		throw new Error('error-invalid-room');
	}

	const roomName = escapeHTML(roomCoordinator.getRoomName(room.t, room));

	const { mutate: unbanUser } = useMutation({
		mutationFn: ({ roomId, username }: { roomId: string; username: string }) => unbanUserEndpoint({ roomId, username }),
		onSuccess: (_, { username }) => {
			dispatchToastMessage({ type: 'success', message: t('User__username__unbanned_from__roomName__', { username, roomName }) });
			void queryClient.invalidateQueries({ queryKey: roomsQueryKeys.bannedUsers(room._id) });
			void queryClient.invalidateQueries({ queryKey: roomsQueryKeys.members(room._id, room.t) });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			setModal(null);
		},
	});

	return useCallback(
		(username: string) => {
			setModal(
				<GenericModal
					variant='danger'
					title={t('Are_you_sure')}
					confirmText={t('Yes_unban_user')}
					onClose={() => setModal(null)}
					onCancel={() => setModal(null)}
					onConfirm={() => unbanUser({ roomId: room._id, username })}
				>
					{t('The_user_will_be_unbanned_from__roomName__', { roomName })}
				</GenericModal>,
			);
		},
		[setModal, roomName, t, room._id, unbanUser],
	);
};
