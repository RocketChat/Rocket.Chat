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
				{t('Are_you_sure_you_want_to_delete_all_reported_messages_from_this_user')}
			</GenericModal>,
		);
	};

	return {
		label: { label: t('Delete_all_messages'), icon: 'trash' },
		action: () => confirmDeletMessages(),
	};
};

export default useDeleteMessagesAction;
