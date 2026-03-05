import { useCallback } from 'react';
import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { useTranslation, useToastMessageDispatch, useSetModal } from '@rocket.chat/ui-contexts';

import { useRoom } from '../../contexts/RoomContext';
import { useChat } from '../../contexts/ChatContext';
import { useScheduleMessage } from '../hooks/useScheduleMessage';
import ScheduleMessageModal from '../../modals/ScheduleMessageModal';

type ScheduleMessageButtonProps = {
	disabled: boolean;
	tmid?: string;
	tshow?: boolean;
	previewUrls?: string[];
};

const ScheduleMessageButton = ({ disabled, tmid, tshow, previewUrls }: ScheduleMessageButtonProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const room = useRoom();
	const chat = useChat();
	const dispatchToastMessage = useToastMessageDispatch();
	const scheduleMessageMutation = useScheduleMessage();

	const handleClick = useCallback(() => {
		const message = chat?.composer?.text ?? '';

		if (!message.trim()) {
			dispatchToastMessage({ type: 'error', message: t('Enter_a_custom_message') });
			return;
		}

		setModal(
			<ScheduleMessageModal
				message={message}
				onClose={() => setModal(null)}
				onSchedule={async (scheduledAt: Date) => {
					try {
						await scheduleMessageMutation.mutateAsync({
							roomId: room._id,
							message,
							scheduledAt,
							tmid,
							tshow,
							previewUrls,
						});

						chat?.composer?.clear();
						dispatchToastMessage({ type: 'success', message: t('Message_scheduled_successfully') });
					} catch (error) {
						dispatchToastMessage({ type: 'error', message: t('Error_scheduling_message') });
					}
				}}
			/>,
		);
	}, [chat, room._id, tmid, tshow, previewUrls, scheduleMessageMutation, setModal, dispatchToastMessage, t]);

	return (
		<MessageComposerAction
			icon='clock'
			disabled={disabled}
			onClick={handleClick}
			title={t('Schedule_message')}
			data-qa-id='schedule-message'
		/>
	);
};

export default ScheduleMessageButton;
