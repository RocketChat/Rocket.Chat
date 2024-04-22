import type { MessageAttachmentBase } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React from 'react';

import AttachmentsItem from './attachments/AttachmentsItem';
import { AttachmentEncryptionContext } from './attachments/contexts/AttachmentEncryptionContext';

type AttachmentsProps = {
	attachments: MessageAttachmentBase[];
	id?: string | undefined;
	isMessageEncrypted?: boolean;
};

const Attachments = ({ attachments, id, isMessageEncrypted = false }: AttachmentsProps): ReactElement => {
	return (
		<>
			<AttachmentEncryptionContext.Provider value={{ isMessageEncrypted }}>
				{attachments?.map((attachment, index) => (
					<AttachmentsItem key={index} id={id} attachment={{ ...attachment }} />
				))}
			</AttachmentEncryptionContext.Provider>
		</>
	);
};

export default Attachments;
