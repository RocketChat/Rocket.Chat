import type { IRoom, IScheduledMessage, Serialized } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { useUserSubscription } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import RoomSection from './layout/RoomSection';
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
	const roomType = subscription?.t ?? scheduledMessages[0]?.roomType;

	return (
		<RoomSection
			avatar={roomType && <RoomAvatar size='x28' room={{ _id: rid, type: roomType }} />}
			title={subscription?.fname || subscription?.name || scheduledMessages[0]?.roomName || rid}
			action={
				<Button small secondary icon='arrow-forward' onClick={() => goToRoom(rid)}>
					{t('Open_room')}
				</Button>
			}
		>
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
		</RoomSection>
	);
};

export default ScheduledMessagesRoomGroup;
