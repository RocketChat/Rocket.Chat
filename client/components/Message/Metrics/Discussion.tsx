import React, { FC } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useTimeAgo } from '../../../hooks/useTimeAgo';
import Metrics, { Reply, Content } from '..';
import { useBlockRendered } from '../hooks/useBlockRendered';


type DicussionOptions = {
	drid: string;
	rid: string;
	count: number;
	lm: Date;
	openDiscussion: () => void;
};

const DiscussionMetric: FC<DicussionOptions> = ({ lm, count, rid, drid, openDiscussion }) => {
	const t = useTranslation();
	const format = useTimeAgo();
	const { className, ref } = useBlockRendered();

	return <Content>
		<div className={className} ref={ref as any} />
		<Reply data-rid={rid} data-drid={drid} onClick={openDiscussion}>{count ? t('message_counter', { counter: count, count }) : t('Reply')}</Reply>
		<Metrics>
			<Metrics.Item title={lm?.toLocaleString()}>
				<Metrics.Item.Icon name='clock'/>
				<Metrics.Item.Label>{lm ? format(lm) : t('No_messages_yet')}</Metrics.Item.Label>
			</Metrics.Item>
		</Metrics>
	</Content>;
};

export default DiscussionMetric;
