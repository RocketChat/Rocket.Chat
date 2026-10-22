import { Throbber } from '@rocket.chat/fuselage';
import {
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarDialog,
	ContextualbarEmptyContent,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
} from '@rocket.chat/ui-client';
import { useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import ScheduledMessageRow from '../../../components/ScheduledMessages/ScheduledMessageRow';
import { useScheduledMessageActions } from '../../../components/ScheduledMessages/useScheduledMessageActions';
import { useScheduledMessages } from '../../../hooks/useScheduledMessages';
import { scheduledMessageEditing } from '../composer/messageBox/ScheduleMessage/useScheduledMessageEditing';
import { useRoom } from '../contexts/RoomContext';

const ScheduledMessagesTab = () => {
	const { t } = useTranslation();
	const { _id: rid } = useRoom();
	const { closeTab, openTab } = useRoomToolbox();
	const { data: scheduledMessages, isLoading } = useScheduledMessages(rid);
	const { sendNow, confirmDelete, reschedule, isPending } = useScheduledMessageActions();

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='clock' />
				<ContextualbarTitle>{t('Scheduled_messages')}</ContextualbarTitle>
				<ContextualbarClose onClick={closeTab} />
			</ContextualbarHeader>
			<ContextualbarContent paddingInline={0} paddingBlock={8}>
				{isLoading && <Throbber size='x12' />}
				{scheduledMessages?.length === 0 && <ContextualbarEmptyContent title={t('No_scheduled_messages')} />}
				{scheduledMessages?.map((scheduledMessage) => (
					<ScheduledMessageRow
						key={scheduledMessage._id}
						scheduledMessage={scheduledMessage}
						onSendNow={sendNow}
						onDelete={confirmDelete}
						onReschedule={reschedule}
						onEdit={(scheduledMessageId, msg, tmid, files) => {
							scheduledMessageEditing.start({ rid, tmid }, { scheduledMessageId, msg, files });
							if (tmid) {
								openTab('thread', tmid);
								return;
							}
							closeTab();
						}}
						disabled={isPending}
					/>
				))}
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default ScheduledMessagesTab;
