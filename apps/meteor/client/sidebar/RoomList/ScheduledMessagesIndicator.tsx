import type { IRoom } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useCanScheduleMessages } from '../../hooks/useCanScheduleMessages';
import { useRoomScheduledMessages } from '../../hooks/useRoomScheduledMessages';

type ScheduledMessagesIndicatorProps = {
	rid: IRoom['_id'];
};

const ScheduledMessagesIndicator = ({ rid }: ScheduledMessagesIndicatorProps) => {
	const { t } = useTranslation();
	const canSchedule = useCanScheduleMessages();
	const { data: items = [] } = useRoomScheduledMessages(rid, canSchedule);
	const pending = items.length;
	const failed = items.filter(({ status }) => status === 'failed').length;

	if (!canSchedule) {
		return null;
	}
	if (failed) {
		return <Icon name='warning' size='x12' color='danger' title={t('Scheduled_messages_failed', { count: failed })} />;
	}
	if (pending) {
		return <Icon name='clock-send' size='x12' title={t('Scheduled_messages_in_room', { count: pending })} />;
	}
	return null;
};

export default ScheduledMessagesIndicator;
