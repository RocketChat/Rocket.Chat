import type { FileProp, MessageAttachmentBase } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React from 'react';

import AttachmentsItem from './attachments/AttachmentsItem';

type AttachmentsProps = {
	file?: FileProp;
	attachments: MessageAttachmentBase[];
};

const Attachments = ({ attachments, file }: AttachmentsProps): ReactElement => {
	return (
		<>
			{attachments?.map((attachment, index) => (
				<AttachmentsItem key={index} file={file} attachment={attachment} />
			))}
		</>
	);
};

export default Attachments;
