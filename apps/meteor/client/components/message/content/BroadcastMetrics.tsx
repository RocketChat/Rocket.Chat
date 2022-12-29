import { MessageBlock, MessageMetrics, MessageMetricsReply } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useBlockRendered } from '../hooks/useBlockRendered';

type BroadcastMetricsProps = {
	username: string;
	mid: string;
	replyBroadcast: () => void;
};

const BroadcastMetrics = ({ username, mid, replyBroadcast }: BroadcastMetricsProps): ReactElement => {
	const t = useTranslation();
	const { className, ref } = useBlockRendered<HTMLDivElement>();

	return (
		<MessageBlock>
			<MessageMetrics>
				<div className={className} ref={ref} />
				<MessageMetricsReply data-username={username} data-mid={mid} onClick={replyBroadcast}>
					{t('Reply')}
				</MessageMetricsReply>
			</MessageMetrics>
		</MessageBlock>
	);
};

export default BroadcastMetrics;
