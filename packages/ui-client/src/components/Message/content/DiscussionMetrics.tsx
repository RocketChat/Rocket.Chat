import {
	MessageBlock,
	MessageMetrics,
	MessageMetricsItem,
	MessageMetricsItemIcon,
	MessageMetricsItemLabel,
	MessageMetricsReply,
} from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useTimeAgo } from '../../../hooks/useTimeAgo';
import { useMessageNavigation } from '../contexts/MessageNavigationContext';

export type DiscussionMetricsProps = {
	drid: string;
	rid: string;
	count: number;
	lm?: Date;
};

const DiscussionMetrics = ({ lm, count, rid, drid }: DiscussionMetricsProps) => {
	const { t } = useTranslation();
	const format = useTimeAgo();
	const { openRoom } = useMessageNavigation();

	return (
		<MessageBlock>
			<MessageMetrics>
				<MessageMetricsReply data-rid={rid} data-drid={drid} onClick={() => openRoom(drid)}>
					{count ? t('message_counter', { count }) : t('Reply')}
				</MessageMetricsReply>
				<MessageMetricsItem title={lm?.toLocaleString()}>
					<MessageMetricsItemIcon name='clock' />
					<MessageMetricsItemLabel>{lm ? format(lm) : t('No_messages_yet')}</MessageMetricsItemLabel>
				</MessageMetricsItem>
			</MessageMetrics>
		</MessageBlock>
	);
};

export default DiscussionMetrics;
