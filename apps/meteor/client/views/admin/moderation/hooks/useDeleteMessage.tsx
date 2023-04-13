import { useEndpoint, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';

const useDeleteMessage = (mid: string, rid: string, onChange: () => void, onReload: () => void) => {
	const t = useTranslation();
	const deleteMessage = useEndpoint('POST', '/v1/chat.delete');
	const dismissMessage = useEndpoint('POST', '/v1/moderation.markChecked');
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const handleDeleteMessages = useMutation({
		mutationFn: deleteMessage,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Deleted') });
		},
	});

	const handleDismissMessage = useMutation({
		mutationFn: dismissMessage,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Moderation_Reports_dismissed') });
		},
	});

	const onDeleteAll = async () => {
		await handleDeleteMessages.mutateAsync({ msgId: mid, roomId: rid, asUser: true });
		await handleDismissMessage.mutateAsync({ msgId: mid });
		onChange();
		onReload();
		setModal();
	};

	const confirmDeletMessage = (): void => {
		setModal(
			<GenericModal
				confirmText={t('Yes_delete_it')}
				title={t('Delete_message')}
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
