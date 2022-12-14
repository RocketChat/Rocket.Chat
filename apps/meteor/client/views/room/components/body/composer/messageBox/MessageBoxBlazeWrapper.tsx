import type { ReactElement } from 'react';
import React, { memo } from 'react';

import type { MessageBoxTemplateInstance } from '../../../../../../../app/ui-message/client/messageBox/messageBox';
import { ChatContext, useChat } from '../../../../contexts/ChatContext';
import { MessageBox } from './MessageBox';

export const MessageBoxBlazeWrapper = ({ chatContext, ...props }: MessageBoxTemplateInstance['data']): ReactElement => {
	const chat = useChat() ?? chatContext;
	return (
		<ChatContext.Provider value={chat}>
			<MessageBox {...props} chatContext={chatContext} />
		</ChatContext.Provider>
	);
};

export default memo(MessageBoxBlazeWrapper);
