import type { IRoom, IScheduledMessage, Serialized } from '@rocket.chat/core-typings';
import { Box, Button, Divider } from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { useUserSubscription } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import ScheduledMessageRow from '../../components/ScheduledMessages/ScheduledMessageRow';
import type { useScheduledMessageActions } from '../../components/ScheduledMessages/useScheduledMessageActions';
import { scheduledMessageEditing } from '../room/composer/messageBox/ScheduleMessage/useScheduledMessageEditing';
import { useGoToRoom } from '../room/hooks/useGoToRoom';

type ScheduledMessagesRoomGroupProps = {
	rid: IRoom['_id'];
	scheduledMessages: Serialized<IScheduledMessage>[];
	actions: ReturnType<typeof useScheduledMessageActions>;
};

const ScheduledMessagesRoomGroup = ({
	rid,
	scheduledMessages,
	actions: { sendNow, confirmDelete, reschedule, isPending },
}: ScheduledMessagesRoomGroupProps) => {
	const { t } = useTranslation();
	const subscription = useUserSubscription(rid);
	const goToRoom = useGoToRoom();
	const headingId = useId();
	const roomType = subscription?.t ?? scheduledMessages[0]?.roomType;

	return (
		<Box is='section' aria-labelledby={headingId} marginBlockEnd={24}>
			<Box display='flex' alignItems='center' justifyContent='space-between' paddingBlock={8} paddingInline={24}>
				<Box display='flex' alignItems='center' minWidth={0}>
					{roomType && <RoomAvatar size='x28' room={{ _id: rid, type: roomType }} />}
					<Box is='h3' id={headingId} fontScale='h4' color='default' marginInlineStart={8} withTruncatedText>
						{subscription?.fname || subscription?.name || scheduledMessages[0]?.roomName || rid}
					</Box>
				</Box>
				<Button small secondary icon='arrow-forward' onClick={() => goToRoom(rid)}>
					{t('Open_room')}
				</Button>
			</Box>
			<Box marginInline={24}>
				<Divider flush />
			</Box>
			{scheduledMessages.map((scheduledMessage) => (
				<ScheduledMessageRow
					key={scheduledMessage._id}
					scheduledMessage={scheduledMessage}
					onSendNow={sendNow}
					onDelete={confirmDelete}
					onReschedule={reschedule}
					onEdit={(scheduledMessageId, msg, tmid, files) => {
						scheduledMessageEditing.start({ rid, tmid }, { scheduledMessageId, msg, files });
						void goToRoom(rid, tmid ? { routeParamsOverrides: { tab: 'thread', context: tmid } } : undefined);
					}}
					disabled={isPending}
				/>
			))}
		</Box>
	);
};

export default ScheduledMessagesRoomGroup;
