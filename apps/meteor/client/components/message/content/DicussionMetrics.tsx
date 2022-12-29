import { MessageBlock, MessageMetrics, MessageMetricsItem, MessageMetricsReply } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, UIEvent } from 'react';
import React from 'react';

import { useTimeAgo } from '../../../hooks/useTimeAgo';
import { useBlockRendered } from '../hooks/useBlockRendered';

type DicussionMetricsProps = {
	drid: string;
	rid: string;
	openDiscussion: (event: UIEvent) => void;
	count: number;
	lm?: Date;
};

const DicussionMetrics = ({ lm, count, rid, drid, openDiscussion }: DicussionMetricsProps): ReactElement => {
	const t = useTranslation();
	const format = useTimeAgo();
	const { className, ref } = useBlockRendered<HTMLDivElement>();

	return (
		<MessageBlock>
			<div className={className} ref={ref} />
			<MessageMetrics>
				<MessageMetricsReply data-rid={rid} data-drid={drid} onClick={openDiscussion}>
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

export default DicussionMetrics;
