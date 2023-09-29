import { useEndpoint, useRouter, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';

import type { GenericMenuItemProps } from '../../../../components/GenericMenu/GenericMenuItem';
import GenericModal from '../../../../components/GenericModal';

const useDismissUserAction = (userId: string, isUserReport?: boolean): GenericMenuItemProps => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const moderationRoute = useRouter();
	const queryClient = useQueryClient();

	const dismissMsgReports = useEndpoint('POST', '/v1/moderation.dismissReports');

	const dismissUserReports = useEndpoint('POST', '/v1/moderation.dismissUserReports');

	const dismissUser = isUserReport ? dismissUserReports : dismissMsgReports;

	const handleDismissUser = useMutation({
		mutationFn: dismissUser,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Moderation_Reports_dismissed_plural') });
		},
	});

	const onDismissUser = async () => {
		await handleDismissUser.mutateAsync({ userId });
		queryClient.invalidateQueries({ queryKey: [isUserReport ? 'moderation.userReports' : 'moderation.reports'] });
		setModal();
		moderationRoute.navigate('/admin/moderation', { replace: true });
	};

	const confirmDismissUser = (): void => {
		setModal(
			<GenericModal
				title={t('Moderation_Dismiss_all_reports')}
				confirmText={t('Moderation_Dismiss_all_reports')}
				variant='danger'
				onConfirm={() => onDismissUser()}
				onCancel={() => setModal()}
			>
				{t('Moderation_Dismiss_all_reports_confirm')}
			</GenericModal>,
		);
	};

	return {
		id: 'approve',
		content: t('Moderation_Dismiss_reports'),
		icon: 'circle-check',
		onClick: () => confirmDismissUser(),
	};
};

export default useDismissUserAction;
