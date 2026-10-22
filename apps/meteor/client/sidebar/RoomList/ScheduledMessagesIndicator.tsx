import type { IRoom } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useCanScheduleMessages } from '../../hooks/useCanScheduleMessages';
import { useMyScheduledMessages } from '../../hooks/useScheduledMessages';

type ScheduledMessagesIndicatorProps = {
	rid: IRoom['_id'];
};

const ScheduledMessagesIndicator = ({ rid }: ScheduledMessagesIndicatorProps) => {
	const { t } = useTranslation();
	const canSchedule = useCanScheduleMessages();
	const { data: { pending = 0, failed = 0 } = {} } = useMyScheduledMessages({
		enabled: canSchedule,
		select: (items) => {
			const own = items.filter((item) => item.rid === rid);
			return { pending: own.length, failed: own.filter(({ status }) => status === 'failed').length };
		},
	});

	if (failed) {
		return <Icon name='warning' size='x12' color='danger' title={t('Scheduled_messages_failed', { count: failed })} />;
	}
	if (pending) {
		return <Icon name='clock' size='x12' title={t('Scheduled_messages_in_room', { count: pending })} />;
	}
	return null;
};

export default ScheduledMessagesIndicator;
