import React, { FC } from 'react';

import { FileProp } from '../../../../definition/IMessage/MessageAttachment/Files/FileProp';
import { MessageAttachmentBase } from '../../../../definition/IMessage/MessageAttachment/MessageAttachmentBase';
import { useBlockRendered } from '../hooks/useBlockRendered';
import Item from './Item';

const Attachments: FC<{ attachments: Array<MessageAttachmentBase>; file?: FileProp }> = ({
	attachments = null,
	file,
}): any => {
	const { className, ref } = useBlockRendered();
	return (
		<>
			<div className={className} ref={ref as any} />
			{attachments &&
				attachments.map((attachment, index) => (
					<Item key={index} file={file} attachment={attachment} />
				))}
		</>
	);
};

export default Attachments;
