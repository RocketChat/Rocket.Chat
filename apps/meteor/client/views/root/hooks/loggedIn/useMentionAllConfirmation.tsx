import type { AtLeast, IMessage } from '@rocket.chat/core-typings';
import { useSetModal, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericModal } from '@rocket.chat/ui-client';

import { onClientBeforeSendMessage } from '../../../../lib/onClientBeforeSendMessage';
import { Rooms } from '../../../../stores';

export const useMentionAllConfirmation = () => {
	const setModal = useSetModal();
	const { t } = useTranslation();
	const askConfirmMentionAll = useUserPreference<boolean>('askConfirmMentionAll', true);

	useEffect(() => {
		const unregister = onClientBeforeSendMessage.use(
			async (message: AtLeast<IMessage, '_id' | 'rid' | 'msg'> & { isEditing?: boolean }) => {
				// Skip if editing
				if (message.isEditing) {
					return message;
				}

				// Skip if user has disabled confirmation
				if (!askConfirmMentionAll) {
					return message;
				}

				// Check for @all or @here mention
				const hasMentionAll = /(?:^|\s)@(all|here)(?:\s|$)/i.test(message.msg);
				if (!hasMentionAll) {
					return message;
				}

				// Get room member count
				const room = Rooms.state.get(message.rid);
				const userCount = room?.usersCount;

				// Show confirmation
				return new Promise<typeof message>((resolve, reject) => {
					const warningMessage = userCount
						? t('Notify_all_in_room_with_count', { count: userCount })
						: t('Notify_all_in_this_room_warning');

					const modal = (
						<GenericModal
							variant='warning'
							title={t('Are_you_sure')}
							confirmText={t('Yes')}
							cancelText={t('Cancel')}
							onConfirm={() => {
								setModal(null);
								resolve(message);
							}}
							onCancel={() => {
								setModal(null);
								reject(new Error('User cancelled'));
							}}
							onClose={() => {
								setModal(null);
								reject(new Error('User cancelled'));
							}}
						>
							{warningMessage}
						</GenericModal>
					) as ReactElement;

					setModal(modal);
		);

		return () => {
			unregister();
		};
	}, [setModal, t, askConfirmMentionAll]);
};
