import { useEndpoint, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';

const useDeleteMessagesAction = (userId: string, onChange: () => void, onReload: () => void) => {
	const t = useTranslation();
	const deleteMessages = useEndpoint('POST', '/v1/moderation.user.deleteMessageHistory');
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const handleDeleteMessages = useMutation({
		mutationFn: deleteMessages,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Deleted') });
		},
	});

	const onDeleteAll = () => {
		handleDeleteMessages.mutate({ userId });
		onChange();
		onReload();
		setModal();
	};

	const confirmDeletMessages = (): void => {
		setModal(
			<GenericModal
				confirmText={t('Yes_delete_it')}
				title={t('delete-message')}
				variant='danger'
				onConfirm={() => onDeleteAll()}
				onCancel={() => setModal()}
			>
				Are you sure you want to delete all reported messages from this user? The messages will be deleted from the message history and no
				one will be able to see it. This action cannot be undone.
			</GenericModal>,
		);
	};

	return {
		label: { label: 'Delete Messages', icon: 'trash' },
		action: () => confirmDeletMessages(),
	};
};

export default useDeleteMessagesAction;
