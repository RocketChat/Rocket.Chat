import { useSetModal, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { MessageBoxScheduleModal } from '../MessageBoxScheduleModal';
import { MessageBoxScheduledMessagesModal } from '../MessageBoxScheduledMessagesModal';
import { useScheduleMenuItems } from '../MessageBoxScheduleMenu';
import { useChat } from '../../../contexts/ChatContext';

export const useScheduleMessageButton = (roomId: string, tmid?: string) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const scheduleMessageEndpoint = useEndpoint('POST', '/v1/chat.scheduleMessage');
	const chatContext = useChat();

	const handleSchedule = useCallback(
		async (scheduledAt: Date) => {
			if (!chatContext?.composer) {
				return;
			}

			const text = chatContext.composer.text || '';
			if (!text.trim()) {
				dispatchToastMessage({ type: 'error', message: t('Add_a_Message') });
				return;
			}

			try {
				await scheduleMessageEndpoint({
					roomId,
					message: text,
					scheduledAt: scheduledAt.toISOString(),
					...(tmid && { tmid }),
				});

				dispatchToastMessage({ type: 'success', message: t('Message_sent') });
				chatContext.composer.clear();
				setModal(null);
			} catch (error: any) {
				const errorMessage = error?.error || error?.message || t('Error');
				dispatchToastMessage({ type: 'error', message: errorMessage });
			}
		},
		[chatContext, roomId, tmid, scheduleMessageEndpoint, dispatchToastMessage, setModal],
	);

	const openScheduleModal = useCallback(() => {
		if (!chatContext?.composer?.text?.trim()) {
			dispatchToastMessage({ type: 'error', message: t('Add_a_Message') });
			return;
		}
		setModal(<MessageBoxScheduleModal onClose={() => setModal(null)} onSchedule={handleSchedule} />);
	}, [chatContext, setModal, handleSchedule, dispatchToastMessage]);

	const openScheduledMessagesModal = useCallback(() => {
		setModal(<MessageBoxScheduledMessagesModal roomId={roomId} onClose={() => setModal(null)} />);
	}, [roomId, setModal]);

	const handleMenuAction = useCallback(
		(actionId: string) => {
			if (actionId === 'schedule-new-message') {
				openScheduleModal();
			} else if (actionId === 'view-scheduled-messages') {
				openScheduledMessagesModal();
			}
		},
		[openScheduleModal, openScheduledMessagesModal],
	);

	const menuItems = useScheduleMenuItems();
	const items = menuItems.map((item) => ({
		...item,
		onClick: () => handleMenuAction(item.id),
	}));

	return {
		scheduleMenu: (
			<GenericMenu
				icon='clock'
				title={t('Schedule_message')}
				sections={[{ items }]}
				detached
				placement='bottom-end'
			/>
		),
	};
};
