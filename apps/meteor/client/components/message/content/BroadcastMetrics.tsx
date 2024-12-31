import type { IMessage } from '@rocket.chat/core-typings';
import { MessageBlock, MessageMetrics, MessageMetricsReply } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useChat } from '../../../views/room/contexts/ChatContext';

type BroadcastMetricsProps = {
	username: string;
	message: IMessage;
};

const BroadcastMetrics = ({ username, message }: BroadcastMetricsProps): ReactElement => {
	const { t } = useTranslation();

	const chat = useChat();

	const handleReplyButtonClick = () => {
		chat?.flows.replyBroadcast(message);
	};

	return (
		<MessageBlock>
			<MessageMetrics>
				<MessageMetricsReply data-username={username} data-mid={message._id} onClick={handleReplyButtonClick}>
					{t('Reply')}
				</MessageMetricsReply>
			</MessageMetrics>
		</MessageBlock>
	);
};

export default BroadcastMetrics;
