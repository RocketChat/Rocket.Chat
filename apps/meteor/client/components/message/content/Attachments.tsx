import type { MessageAttachmentBase } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React from 'react';

import AttachmentsItem from './attachments/AttachmentsItem';

type AttachmentsProps = {
	attachments: MessageAttachmentBase[];
	id?: string | undefined;
	isMessageEncrypted?: boolean;
};

const Attachments = ({ attachments, id, isMessageEncrypted = false }: AttachmentsProps): ReactElement => {
	return (
		<>
			{attachments?.map((attachment, index) => (
				<AttachmentsItem key={index} id={id} attachment={{ ...attachment }} isMessageEncrypted={isMessageEncrypted} />
			))}
		</>
	);
};

export default Attachments;
