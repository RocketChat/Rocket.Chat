import { Message } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import { useTimeAgo } from '../../../hooks/useTimeAgo';
import { useBlockRendered } from '../hooks/useBlockRendered';

type DicussionOptions = {
	drid: string;
	rid: string;
	openDiscussion: () => void;
	count: number;
	lm?: Date;
};

const DiscussionMetric: FC<DicussionOptions> = ({ lm, count, rid, drid, openDiscussion }) => {
	const t = useTranslation();
	const format = useTimeAgo();
	const { className, ref } = useBlockRendered<HTMLDivElement>();

	return (
		<Message.Block>
			<div className={className} ref={ref} />
			<Message.Metrics>
				<Message.Metrics.Reply data-rid={rid} data-drid={drid} onClick={openDiscussion}>
					{count ? t('message_counter', { counter: count, count }) : t('Reply')}
				</Message.Metrics.Reply>
				<Message.Metrics.Item title={lm?.toLocaleString()}>
					<Message.Metrics.Item.Icon name='clock' />
					<Message.Metrics.Item.Label>{lm ? format(lm) : t('No_messages_yet')}</Message.Metrics.Item.Label>
				</Message.Metrics.Item>
			</Message.Metrics>
		</Message.Block>
	);
};

export default DiscussionMetric;
