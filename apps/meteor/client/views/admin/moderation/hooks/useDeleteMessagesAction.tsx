import { useEndpoint, useRoute, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';

const useDeleteMessagesAction = (userId: string) => {
	const t = useTranslation();
	const deleteMessages = useEndpoint('POST', '/v1/moderation.user.deleteReportedMessages');
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const moderationRoute = useRoute('moderation-console');
	const queryClient = useQueryClient();

	const handleDeleteMessages = useMutation({
		mutationFn: deleteMessages,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Moderation_Messages_deleted') });
		},
	});

	const onDeleteAll = async () => {
		await handleDeleteMessages.mutateAsync({ userId });
		queryClient.invalidateQueries({ queryKey: ['moderation.reports'] });
		setModal();
		moderationRoute.push({});
	};

	const confirmDeletMessages = (): void => {
		setModal(
			<GenericModal
				confirmText={t('Moderation_Dismiss_and_delete')}
				title={t('Moderation_Delete_all_messages')}
				variant='danger'
				onConfirm={() => onDeleteAll()}
				onCancel={() => setModal()}
			>
				{t('Moderation_Are_you_sure_you_want_to_delete_all_reported_messages_from_this_user')}
			</GenericModal>,
		);
	};

	return {
		label: { label: t('Moderation_Delete_all_messages'), icon: 'trash' },
		action: () => confirmDeletMessages(),
	};
};

export default useDeleteMessagesAction;
