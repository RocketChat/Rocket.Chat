import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useEndpoint, useRouteParameter, useRouter, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../components/GenericModal';

const useDeactivateUserAction = (userId: string, isUserReport?: boolean): GenericMenuItemProps => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const deactiveUser = useEndpoint('POST', '/v1/users.setActiveStatus');
	const deleteMessages = useEndpoint('POST', '/v1/moderation.user.deleteReportedMessages');
	const dismissUserReports = useEndpoint('POST', '/v1/moderation.dismissUserReports');

	const router = useRouter();

	const tab = useRouteParameter('tab');

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

	const handleDismissUserReports = useMutation({
		mutationFn: dismissUserReports,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Moderation_Reports_dismissed') });
		},
	});

	const onDeactivateUser = async () => {
		setModal();
		!isUserReport && (await handleDeleteMessages.mutateAsync({ userId }));
		await handleDeactivateUser.mutateAsync({ userId, activeStatus: false, confirmRelinquish: true });
		await handleDismissUserReports.mutateAsync({ userId });
		queryClient.invalidateQueries({ queryKey: ['moderation'] });
		router.navigate(`/admin/moderation/${tab}`);
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
		id: 'deactiveUser',
		content: t('Moderation_Deactivate_User'),
		icon: 'ban',
		onClick: () => confirmDeactivateUser(),
	};
};

export default useDeactivateUserAction;
