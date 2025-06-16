import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../components/GenericModal';

export const useDismissMessageAction = (msgId: string): { action: () => void } => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const dismissMessage = useEndpoint('POST', '/v1/moderation.dismissReports');

	const handleDismissMessage = useMutation({
		mutationFn: dismissMessage,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Moderation_Reports_dismissed') });
		},
	});

	const onDismissMessage = async () => {
		await handleDismissMessage.mutateAsync({ msgId });
		queryClient.invalidateQueries({ queryKey: ['moderation', 'msgReports'] });
		setModal();
	};

	const confirmDismissMessage = (): void => {
		setModal(
			<GenericModal
				title={t('Moderation_Dismiss_reports')}
				confirmText={t('Moderation_Dismiss_reports')}
				variant='danger'
				onConfirm={() => onDismissMessage()}
				onCancel={() => setModal()}
			>
				{t('Moderation_Dismiss_reports_confirm')}
			</GenericModal>,
		);
	};

	return {
		action: () => confirmDismissMessage(),
	};
};
