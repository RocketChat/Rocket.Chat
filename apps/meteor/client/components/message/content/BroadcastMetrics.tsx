import type { IMessage } from '@rocket.chat/core-typings';
import { MessageBlock, MessageMetrics, MessageMetricsReply } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useMessageActions } from '../../../views/room/contexts/MessageContext';
import { useBlockRendered } from '../hooks/useBlockRendered';

type BroadcastMetricsProps = {
	username: string;
	mid: string;
	message: IMessage;
};

const BroadcastMetrics = ({ username, mid, message }: BroadcastMetricsProps): ReactElement => {
	const t = useTranslation();
	const { className, ref } = useBlockRendered<HTMLDivElement>();

	const {
		actions: { replyBroadcast },
	} = useMessageActions();

	return (
		<MessageBlock>
			<MessageMetrics>
				<div className={className} ref={ref} />
				<MessageMetricsReply data-username={username} data-mid={mid} onClick={(): void => replyBroadcast(message)}>
					{t('Reply')}
				</MessageMetricsReply>
			</MessageMetrics>
		</MessageBlock>
	);
};

export default BroadcastMetrics;
