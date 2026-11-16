import type { IMessage } from '@rocket.chat/core-typings';
import { MessageBlock, MessageMetrics, MessageMetricsReply } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useMessageInteractions } from '../contexts/MessageInteractionsContext';

export type BroadcastMetricsProps = {
	username: string;
	message: IMessage;
};

const BroadcastMetrics = ({ username, message }: BroadcastMetricsProps) => {
	const { t } = useTranslation();
	const { replyBroadcast } = useMessageInteractions();

	return (
		<MessageBlock>
			<MessageMetrics>
				<MessageMetricsReply data-username={username} data-mid={message._id} onClick={() => replyBroadcast(message)}>
					{t('Reply')}
				</MessageMetricsReply>
			</MessageMetrics>
		</MessageBlock>
	);
};

export default BroadcastMetrics;
