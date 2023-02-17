import { MessageBlock, MessageMetrics, MessageMetricsItem, MessageMetricsReply } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useTimeAgo } from '../../../hooks/useTimeAgo';
import { useGoToRoom } from '../../../views/room/hooks/useGoToRoom';

type DiscussionMetricsProps = {
	drid: string;
	rid: string;
	count: number;
	lm?: Date;
};

const DiscussionMetrics = ({ lm, count, rid, drid }: DiscussionMetricsProps): ReactElement => {
	const t = useTranslation();
	const format = useTimeAgo();

	const goToRoom = useGoToRoom();

	return (
		<MessageBlock>
			<MessageMetrics>
				<MessageMetricsReply data-rid={rid} data-drid={drid} onClick={() => goToRoom(drid)}>
					{count ? t('message_counter', { counter: count, count }) : t('Reply')}
				</MessageMetricsReply>
				<MessageMetricsItem title={lm?.toLocaleString()}>
					<MessageMetricsItem.Icon name='clock' />
					<MessageMetricsItem.Label>{lm ? format(lm) : t('No_messages_yet')}</MessageMetricsItem.Label>
				</MessageMetricsItem>
			</MessageMetrics>
		</MessageBlock>
	);
};

export default DiscussionMetrics;
