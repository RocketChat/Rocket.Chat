import { GenericModal, useFormatDateAndTime } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import ScheduleMessageModal from './ScheduleMessageModal';
import { isScheduledAtInRange } from '../../../lib/scheduledMessageLimits';
import { scheduledMessagesQueryKeys } from '../../lib/queryKeys';

export const useScheduledMessageActions = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const sendNow = useEndpoint('POST', '/v1/scheduledMessages.sendNow');
	const deleteScheduledMessage = useEndpoint('POST', '/v1/scheduledMessages.delete');
	const updateScheduledMessage = useEndpoint('POST', '/v1/scheduledMessages.update');
	const formatDateAndTime = useFormatDateAndTime();

	const { mutate, isPending } = useMutation({
		mutationFn: ({ action, scheduledMessageId }: { action: 'sendNow' | 'delete'; scheduledMessageId: string }) =>
			action === 'sendNow' ? sendNow({ scheduledMessageId }) : deleteScheduledMessage({ scheduledMessageId }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
		onSettled: () => queryClient.invalidateQueries({ queryKey: scheduledMessagesQueryKeys.all }),
	});

	const confirmDelete = (scheduledMessageId: string) =>
		setModal(
			<GenericModal
				variant='danger'
				title={t('Are_you_sure')}
				confirmText={t('Yes_delete_it')}
				onConfirm={() => {
					setModal(null);
					mutate({ action: 'delete', scheduledMessageId });
				}}
				onCancel={() => setModal(null)}
				onClose={() => setModal(null)}
			>
				{t('Scheduled_message_delete_warning')}
			</GenericModal>,
		);

	const reschedule = (scheduledMessageId: string, currentScheduledAt: string) => {
		const current = new Date(currentScheduledAt);
		setModal(
			<ScheduleMessageModal
				initialDate={isScheduledAtInRange(current, new Date()) ? current : undefined}
				onConfirm={async (scheduledAt) => {
					try {
						await updateScheduledMessage({ scheduledMessageId, scheduledAt: scheduledAt.toISOString() });
					} catch (error) {
						dispatchToastMessage({ type: 'error', message: error });
						throw error;
					}
					setModal(null);
					dispatchToastMessage({ type: 'success', message: t('Message_rescheduled_for', { date: formatDateAndTime(scheduledAt) }) });
					void queryClient.invalidateQueries({ queryKey: scheduledMessagesQueryKeys.all });
				}}
				onClose={() => setModal(null)}
			/>,
		);
	};

	return {
		reschedule,
		sendNow: (scheduledMessageId: string) => mutate({ action: 'sendNow', scheduledMessageId }),
		confirmDelete,
		isPending,
	};
};
