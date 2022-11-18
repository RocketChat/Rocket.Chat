import { FileProp, MessageAttachmentBase } from '@rocket.chat/core-typings';
import React, { ContextType, ReactElement, useContext } from 'react';

import { MessageContext } from '../../../views/room/contexts/MessageContext';
import { useBlockRendered } from '../hooks/useBlockRendered';
import Item from './Item';

type AttachmentsProps = {
	file?: FileProp;
	attachments: MessageAttachmentBase[];
	messageContext?: ContextType<typeof MessageContext>; // TODO: Remove this prop when threads are implemented as a component
};

const Attachments = ({ attachments, file, messageContext }: AttachmentsProps): ReactElement => {
	const { className, ref } = useBlockRendered<HTMLDivElement>();
	const outerMessageContext = useContext(MessageContext); // TODO: Remove this hack when threads are implemented as a component

	return (
		<MessageContext.Provider value={messageContext ?? outerMessageContext}>
			<div className={className} ref={ref} />
			{attachments?.map((attachment, index) => (
				<Item key={index} file={file} attachment={attachment} />
			))}
		</MessageContext.Provider>
	);
};

export default Attachments;
