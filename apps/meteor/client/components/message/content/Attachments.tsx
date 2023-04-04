import type { MessageAttachmentBase } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React from 'react';

import AttachmentsItem from './attachments/AttachmentsItem';

type AttachmentsProps = {
	attachments: MessageAttachmentBase[];
	collapsed?: boolean;
};

const Attachments = ({ attachments, collapsed }: AttachmentsProps): ReactElement => {
	return (
		<>
			{attachments?.map((attachment, index) => (
				<AttachmentsItem key={index} attachment={{ ...attachment, collapsed }} />
			))}
		</>
	);
};

export default Attachments;
