import {
	MessageBlock,
	MessageMetrics,
	MessageMetricsItem,
	MessageMetricsItemIcon,
	MessageMetricsItemLabel,
	MessageMetricsReply,
} from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useTimeAgo } from '../../../hooks/useTimeAgo';
import { useGoToRoom } from '../../../views/room/hooks/useGoToRoom';

type DiscussionMetricsProps = {
	drid: string;
	rid: string;
	count: number;
	lm?: Date;
};

const DiscussionMetrics = ({ lm, count, rid, drid }: DiscussionMetricsProps): ReactElement => {
	const { t } = useTranslation();
	const format = useTimeAgo();

	const goToRoom = useGoToRoom();

	return (
		<MessageBlock>
			<MessageMetrics>
				<MessageMetricsReply data-rid={rid} data-drid={drid} onClick={() => goToRoom(drid)}>
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
