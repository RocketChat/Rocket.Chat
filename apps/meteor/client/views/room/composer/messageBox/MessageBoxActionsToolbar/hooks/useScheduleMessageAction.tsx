import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';
import ScheduleMessageModal from '../../../../modals/ScheduleMessageModal/ScheduleMessageModal';
import type { ChatAPI } from '../../../../lib/chats/ChatAPI';

/**
 * Provides the generic action item to schedule messages from the composer toolbar.
 *
 * @param disabled Whether the action item should be disabled.
 * @param room The current room context.
 * @param chat The chat API instance.
 * @param tmid Optional thread message ID if scheduling within a thread.
 * @returns The generic menu item properties for the schedule action.
 */
export const useScheduleMessageAction = (
	disabled: boolean,
	room: IRoom,
	chat: ChatAPI,
	tmid?: IMessage['tmid'],
): GenericMenuItemProps => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	const handleSchedule = () => {
		const text = chat?.composer?.text ?? '';

		
		if (!text.trim()) return;

		setModal(
			<ScheduleMessageModal
				rid={room._id}
				tmid={tmid}
				text={text}
				onClose={() => setModal(null)}
				onScheduled={() => {
					if (typeof chat?.composer?.clear === 'function') {
						chat.composer.clear();
					}
				}}
			/>,
		);
	};

	return {
		id: 'schedule-message',
		content: t('Schedule_message'),
		icon: 'clock',
		disabled,
		onClick: handleSchedule,
	};
};