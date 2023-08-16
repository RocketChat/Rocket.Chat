import { useEndpoint, useRoute, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';

const useDeactivateUserAction = (userId: string) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const deactiveUser = useEndpoint('POST', '/v1/users.setActiveStatus');
	const deleteMessages = useEndpoint('POST', '/v1/moderation.user.deleteReportedMessages');
	const moderationRoute = useRoute('moderation-console');

	const handleDeactivateUser = useMutation({
		mutationFn: deactiveUser,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Moderation_User_deactivated') });
		},
	});

	const handleDeleteMessages = useMutation({
		mutationFn: deleteMessages,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Moderation_Messages_deleted') });
		},
	});

	const onDeactivateUser = async () => {
		setModal();
		await handleDeleteMessages.mutateAsync({ userId });
		await handleDeactivateUser.mutateAsync({ userId, activeStatus: false, confirmRelinquish: true });
		queryClient.invalidateQueries({ queryKey: ['moderation.reports'] });
		moderationRoute.push({});
	};

	const confirmDeactivateUser = (): void => {
		setModal(
			<GenericModal
				title={t('Moderation_Deactivate_User')}
				confirmText={t('Moderation_Deactivate_User')}
				variant='danger'
				onConfirm={() => onDeactivateUser()}
				onCancel={() => setModal()}
			>
				{t('Moderation_Are_you_sure_you_want_to_deactivate_this_user')}
			</GenericModal>,
		);
	};

	return {
		label: { label: t('Moderation_Deactivate_User'), icon: 'ban' },
		action: () => confirmDeactivateUser(),
	};
};

export default useDeactivateUserAction;
