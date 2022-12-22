import type { FileProp, MessageAttachmentBase } from '@rocket.chat/core-typings';
import type { ContextType, ReactElement } from 'react';
import React, { useContext } from 'react';

import { ChatContext } from '../../../views/room/contexts/ChatContext';
import { MessageContext } from '../../../views/room/contexts/MessageContext';
import { useBlockRendered } from '../hooks/useBlockRendered';
import Item from './Item';

type AttachmentsProps = {
	file?: FileProp;
	attachments: MessageAttachmentBase[];
	chatContext?: ContextType<typeof ChatContext>; // TODO: Remove this prop when threads are implemented as a component
	messageContext?: ContextType<typeof MessageContext>; // TODO: Remove this prop when threads are implemented as a component
};

const Attachments = ({ attachments, file, chatContext, messageContext }: AttachmentsProps): ReactElement => {
	const { className, ref } = useBlockRendered<HTMLDivElement>();
	const outerChatContext = useContext(ChatContext); // TODO: Remove this hook when threads are implemented as a component
	const outerMessageContext = useContext(MessageContext); // TODO: Remove this hack when threads are implemented as a component

	return (
		<ChatContext.Provider value={chatContext ?? outerChatContext}>
			{/*  TODO: Remove this hack when threads are implemented as a component */}
			<MessageContext.Provider value={messageContext ?? outerMessageContext}>
				<div className={className} ref={ref} />
				{attachments?.map((attachment, index) => (
					<Item key={index} file={file} attachment={attachment} />
				))}
			</MessageContext.Provider>
		</ChatContext.Provider>
	);
};

export default Attachments;
