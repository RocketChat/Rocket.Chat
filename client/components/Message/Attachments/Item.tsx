import React, { FC, memo } from 'react';

import { AttachmentProps } from './AttachmentProps';
import DefaultAttachment from './DefaultAttachment';
import { FileProp } from './FileProp';
import { isFileAttachment, FileAttachment } from './Files';
import { QuoteAttachment, QuoteAttachmentProps } from './QuoteAttachment';

const isQuoteAttachment = (attachment: AttachmentProps): attachment is QuoteAttachmentProps =>
	'message_link' in attachment;

const Item: FC<{ attachment: AttachmentProps; file?: FileProp }> = ({ attachment, file }) => {
	if (isFileAttachment(attachment)) {
		return <FileAttachment {...attachment} file={file} />;
	}

	if (isQuoteAttachment(attachment)) {
		return <QuoteAttachment {...attachment} />;
	}

	return <DefaultAttachment {...(attachment as any)} />;
};

export default memo(Item);
