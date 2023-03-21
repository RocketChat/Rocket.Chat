import type { MessageAttachmentBase } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React from 'react';

import MessageContentBody from '../../MessageContentBody';

type AttachmentsProps = {
	attachments: MessageAttachmentBase[];
};

const DescriptionAttachment = ({ attachments }: AttachmentsProps): ReactElement => {
	return (
		<>
			{attachments?.map((attachment) => {
				return attachment.descriptionMd && <MessageContentBody md={attachment.descriptionMd} />;
			})}
		</>
	);
};

export default DescriptionAttachment;
