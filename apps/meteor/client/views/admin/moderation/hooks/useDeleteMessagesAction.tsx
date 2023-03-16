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
			<GenericModal variant='danger' onConfirm={() => onDeleteAll()} onCancel={() => setModal()}>
				This action will delete all reported messages from this user, and remove the report from this console. Are you sure you want to
				continue?
			</GenericModal>,
		);
	};

	return {
		label: { label: 'Delete Messages', icon: 'trash' },
		action: () => confirmDeletMessages(),
	};
};

export default useDeleteMessagesAction;
