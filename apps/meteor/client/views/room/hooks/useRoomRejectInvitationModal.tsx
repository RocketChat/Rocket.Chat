import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoomName } from '../../../hooks/useRoomName';
import type { IRoomWithFederationOriginalName } from '../contexts/RoomContext';

type RoomRejectInvitationModalResult = {
	open: () => Promise<boolean>;
	close: () => void;
};

export const useRoomRejectInvitationModal = (room: IRoomWithFederationOriginalName): RoomRejectInvitationModalResult => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const roomName = useRoomName(room) || t('unknown');
	const { inviter } = useUserSubscription(room._id) ?? {};

	const username = inviter?.username?.startsWith('@') ? inviter.username : `@${inviter?.username || t('unknown')}`;
	const description =
		room.t === 'd'
			? t('Reject_dm_invitation_description', { username })
			: t('Reject_channel_invitation_description', { username, roomName });

	const close = useCallback((): void => setModal(null), [setModal]);
	const open = useCallback(
		() =>
			new Promise<boolean>((resolve) => {
				setModal(
					<GenericModal
						icon={null}
						variant='danger'
						title={t('Reject_invitation')}
						confirmText={t('Reject_invitation')}
						onConfirm={() => {
							resolve(true);
							setModal(null);
						}}
						onCancel={() => {
							resolve(false);
							close();
						}}
					>
						{description}
					</GenericModal>,
				);
			}),
		[close, description, setModal, t],
	);

	return { open, close };
};
