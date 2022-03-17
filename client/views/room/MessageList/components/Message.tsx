/* eslint-disable complexity */
import { Message as MessageTemplate, MessageLeftContainer, MessageContainer, MessageBody } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import React, { FC, memo } from 'react';

import { IMessage } from '../../../../../definition/IMessage';
import { ISubscription } from '../../../../../definition/ISubscription';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useIsEditingMessage } from '../contexts/MessageEditingContext';
import { useIsSelecting, useToggleSelect, useIsSelectedMessage } from '../contexts/SelectedMessagesContext';
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
	const isEditingMessage = useIsEditingMessage(message._id);
	const [isMessageIgnored, toggleMessageIgnored] = useToggle(message.ignored);

	const isSelecting = useIsSelecting();
	const toggleSelected = useToggleSelect(message._id);
	const isSelected = useIsSelectedMessage(message._id);

	const handleStyle = (): { backgroundColor: string } | undefined => {
		if (isSelecting && isSelected) {
			return style; // TO DO: change selecting style
		}
		if (isEditingMessage) {
			return style;
		}
	};

	return (
		<MessageTemplate {...props} style={handleStyle()} onClick={isSelecting ? toggleSelected : undefined}>
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
