import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useEndpoint, useRouter, useSetModal, useToastMessageDispatch, useRouteParameter } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../components/GenericModal';

const useDismissUserAction = (userId: string, isUserReport?: boolean): GenericMenuItemProps => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const moderationRoute = useRouter();
	const tab = useRouteParameter('tab');
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
			dispatchToastMessage({ type: 'success', message: t('Moderation_Reports_all_dismissed') });
		},
	});

	const onDismissUser = async () => {
		await handleDismissUser.mutateAsync({ userId });
		queryClient.invalidateQueries({ queryKey: ['moderation', 'userReports'] });
		setModal();
		moderationRoute.navigate(`/admin/moderation/${tab}`, { replace: true });
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
