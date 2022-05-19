/* eslint-disable complexity */
import { IMessage } from '@rocket.chat/core-typings';
import { parser } from '@rocket.chat/message-parser';
import React, { FC, memo, useMemo } from 'react';

import { isE2EEMessage } from '../../../../../lib/isE2EEMessage';
import ASTMessageRender from '../../../../components/Message/MessageBodyRender/ASTMessageRender';
import ASTThreadPreviewRender from '../../../../components/Message/MessageBodyRender/ThreadPreviewRender/ASTThreadPreviewRender';
import { useMessageActions } from '../../contexts/MessageContext';
import EncryptedMessageRender from './EncryptedMessageRender';

const MessageRender: FC<{ message: IMessage; isThreadPreview?: boolean }> = ({ message, isThreadPreview }) => {
	const {
		actions: { openRoom, openUserCard },
	} = useMessageActions();

	const isEncryptedMessage = isE2EEMessage(message);

	const tokens = useMemo(() => (message.msg ? parser(message.msg) : []), [message.msg]);

	if (isThreadPreview) {
		return <ASTThreadPreviewRender mentions={message?.mentions || []} channels={message?.channels || []} tokens={tokens} />;
	}

	return (
		<>
			{!isEncryptedMessage && !message.blocks && message.md && (
				<ASTMessageRender
					onUserMentionClick={openUserCard}
					onChannelMentionClick={openRoom}
					mentions={message?.mentions || []}
					channels={message?.channels || []}
					tokens={message.md}
					isThreadPreview={isThreadPreview}
				/>
			)}

			{!isEncryptedMessage && !message.blocks && !message.md && message.msg}

			{isEncryptedMessage && <EncryptedMessageRender message={message} />}
		</>
	);
};

export default memo(MessageRender);
