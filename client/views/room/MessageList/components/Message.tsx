/* eslint-disable complexity */
import { Message as MessageTemplate, MessageLeftContainer, MessageContainer, MessageBody } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import React, { FC, memo } from 'react';

import { IMessage } from '../../../../../definition/IMessage';
import { ISubscription } from '../../../../../definition/ISubscription';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useIsMessageHighlight } from '../contexts/MessageHighlightContext';
import MessageContent from './MessageContent';
import MessageContentIgnored from './MessageContentIgnored';
import MessageHeader from './MessageHeader';
import { MessageIndicators } from './MessageIndicators';
import Toolbox from './Toolbox';

const style = { backgroundColor: 'var(--message-box-editing-color)' };

const Message: FC<{ message: IMessage; sequential: boolean; subscription?: ISubscription; id: IMessage['_id'] }> = ({
	message,
	sequential,
	subscription,
	...props
}) => {
	const isMessageHighlight = useIsMessageHighlight(message._id);
	const [isMessageIgnored, toggleMessageIgnored] = useToggle(message.ignored);

	return (
		<MessageTemplate {...props} style={isMessageHighlight ? style : undefined}>
			<MessageLeftContainer>
				{!sequential && message.u.username && <UserAvatar username={message.u.username} size={'x36'} />}
				{sequential && <MessageIndicators message={message} />}
			</MessageLeftContainer>

			<MessageContainer>
				{!sequential && <MessageHeader message={message} />}

				{!isMessageIgnored && <MessageContent id={message._id} message={message} subscription={subscription} sequential={sequential} />}

				{isMessageIgnored && (
					<MessageBody>
						<MessageContentIgnored onShowMessageIgnored={toggleMessageIgnored} />
					</MessageBody>
				)}
			</MessageContainer>
			{!message.private && <Toolbox message={message} />}
		</MessageTemplate>
	);
};

export default memo(Message);
