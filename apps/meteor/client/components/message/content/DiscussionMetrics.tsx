import { MessageBlock, MessageMetrics, MessageMetricsItem, MessageMetricsReply } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useTimeAgo } from '../../../hooks/useTimeAgo';
import { useMessageActions } from '../../../views/room/contexts/MessageContext';
import { useBlockRendered } from '../hooks/useBlockRendered';

type DiscussionMetricsProps = {
	drid: string;
	rid: string;
	count: number;
	lm?: Date;
};

const DiscussionMetrics = ({ lm, count, rid, drid }: DiscussionMetricsProps): ReactElement => {
	const t = useTranslation();
	const format = useTimeAgo();
	const { className, ref } = useBlockRendered<HTMLDivElement>();

	const {
		actions: { openRoom },
	} = useMessageActions();

	return (
		<MessageBlock>
			<div className={className} ref={ref} />
			<MessageMetrics>
				<MessageMetricsReply data-rid={rid} data-drid={drid} onClick={openRoom(drid)}>
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
