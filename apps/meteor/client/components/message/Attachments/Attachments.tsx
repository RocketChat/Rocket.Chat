import { FileProp, MessageAttachmentBase } from '@rocket.chat/core-typings';
import React, { ReactElement } from 'react';

import { useBlockRendered } from '../hooks/useBlockRendered';
import Item from './Item';

type AttachmentsProps = {
	file?: FileProp;
	attachments: MessageAttachmentBase[];
};

const Attachments = ({ attachments, file }: AttachmentsProps): ReactElement => {
	const { className, ref } = useBlockRendered<HTMLDivElement>();
	return (
		<>
			<div className={className} ref={ref} />
			{attachments?.map((attachment, index) => (
				<Item key={index} file={file} attachment={attachment} />
			))}
		</>
	);
};

export default Attachments;
