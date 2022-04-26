/* eslint-disable complexity */
import { IMessage } from '@rocket.chat/core-typings';
import React, { FC, memo } from 'react';

import { isE2EEMessage } from '../../../../../lib/isE2EEMessage';
import MessageBodyRender from '../../../../components/Message/MessageBodyRender';
import { useMessageActions } from '../../contexts/MessageContext';
import EncryptedMessageRender from './EncryptedMessageRender';

const MessageRender: FC<{ message: IMessage; disableBigEmoji?: boolean }> = ({ message, disableBigEmoji = false }) => {
	const {
		actions: { openRoom, openUserCard },
	} = useMessageActions();

	const isEncryptedMessage = isE2EEMessage(message);

	return (
		<>
			{!isEncryptedMessage && !message.blocks && message.md && (
				<MessageBodyRender
					onUserMentionClick={openUserCard}
					onChannelMentionClick={openRoom}
					mentions={message?.mentions || []}
					channels={message?.channels || []}
					tokens={message.md}
					disableBigEmoji={disableBigEmoji}
				/>
			)}

			{!isEncryptedMessage && !message.blocks && !message.md && message.msg}

			{isEncryptedMessage && <EncryptedMessageRender message={message} />}
		</>
	);
};

export default memo(MessageRender);
