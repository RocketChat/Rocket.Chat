import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useMediaPlayer } from '../../../../providers/MediaPlayerProvider/MediaPlayerContext';

const useDeleteMessage = (mid: string, rid: string, onChange: () => void) => {
	const { t } = useTranslation();
	const deleteMessage = useEndpoint('POST', '/v1/chat.delete');
	const dismissMessage = useEndpoint('POST', '/v1/moderation.dismissReports');
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const queryClient = useQueryClient();
	const { track, close: closeMediaPlayer } = useMediaPlayer();

	const handleDeleteMessages = useMutation({
		mutationFn: deleteMessage,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
			setModal();
		},
		onSuccess: async () => {
			// Deletion streams are authorized by room access, which a moderator may not have.
			if (track?.mid === mid) {
				closeMediaPlayer();
			}

			await handleDismissMessage.mutateAsync({ msgId: mid });
		},
	});

	const handleDismissMessage = useMutation({
		mutationFn: dismissMessage,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Moderation_Message_deleted') });
		},
		onSettled: () => {
			onChange();
			queryClient.invalidateQueries({ queryKey: ['moderation', 'msgReports'] });
			setModal();
		},
	});

	const onDeleteAll = async () => {
		await handleDeleteMessages.mutateAsync({ msgId: mid, roomId: rid, asUser: true });
	};

	const confirmDeletMessage = (): void => {
		setModal(
			<GenericModal
				confirmText={t('Moderation_Dismiss_and_delete')}
				title={t('Moderation_Delete_this_message')}
				variant='danger'
				onConfirm={() => onDeleteAll()}
				onCancel={() => setModal()}
			>
				{t('Moderation_Are_you_sure_you_want_to_delete_this_message')}
			</GenericModal>,
		);
	};

	return confirmDeletMessage;
};

export default useDeleteMessage;
