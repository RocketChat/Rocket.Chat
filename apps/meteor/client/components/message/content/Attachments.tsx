import type { FileProp, MessageAttachmentBase } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React from 'react';

import { useBlockRendered } from '../hooks/useBlockRendered';
import AttachmentsItem from './attachments/AttachmentsItem';

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
				<AttachmentsItem key={index} file={file} attachment={attachment} />
			))}
		</>
	);
};

export default Attachments;
