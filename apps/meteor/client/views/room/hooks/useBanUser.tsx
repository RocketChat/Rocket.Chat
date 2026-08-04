import { escapeHTML } from '@rocket.chat/string-helpers';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useUserRoom, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { roomsQueryKeys } from '../../../lib/queryKeys';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

type UseBanUserProps = {
	roomId: string;
};

export const useBanUser = ({ roomId }: UseBanUserProps) => {
	const { t } = useTranslation();
	const room = useUserRoom(roomId);
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const banUserEndpoint = useEndpoint('POST', '/v1/rooms.banUser');

	if (!room) {
		throw new Error('error-invalid-room');
	}

	const roomName = escapeHTML(roomCoordinator.getRoomName(room.t, room));

	const { mutate: banUser } = useMutation({
		mutationFn: ({ roomId, username }: { roomId: string; username: string }) => {
			return banUserEndpoint({ roomId, username });
		},
		onSuccess: (_, { username }) => {
			dispatchToastMessage({ type: 'success', message: t('User__username__banned_from__roomName__', { username, roomName }) });
			void queryClient.invalidateQueries({ queryKey: roomsQueryKeys.members(room._id, room.t) });
			void queryClient.invalidateQueries({ queryKey: roomsQueryKeys.bannedUsers(room._id) });
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
					confirmText={t('Yes_ban_user')}
					onClose={() => setModal(null)}
					onCancel={() => setModal(null)}
					onConfirm={() => banUser({ roomId: room._id, username })}
				>
					{t('The_user_will_be_banned_from__roomName__', { roomName })}
				</GenericModal>,
			);
		},
		[setModal, t, roomName, room._id, banUser],
	);
};
