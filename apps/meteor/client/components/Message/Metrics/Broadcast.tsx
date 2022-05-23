import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import { useBlockRendered } from '../hooks/useBlockRendered';
import Content from './Content';
import Reply from './Reply';

type BroadcastOptions = {
	username: string;
	mid: string;
	replyBroadcast: () => void;
};

const BroadcastMetric: FC<BroadcastOptions> = ({ username, mid, replyBroadcast }) => {
	const t = useTranslation();
	const { className, ref } = useBlockRendered<HTMLDivElement>();

	return (
		<Content>
			<div className={className} ref={ref} />
			<Reply data-username={username} data-mid={mid} onClick={replyBroadcast}>
				{t('Reply')}
			</Reply>
		</Content>
	);
};

export default BroadcastMetric;
