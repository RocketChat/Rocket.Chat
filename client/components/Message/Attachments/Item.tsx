import React, { FC, memo } from 'react';

import DefaultAttachment from './DefaultAttachment';
import { FileAttachment } from './Files';
import { isFileAttachment } from './Files/definitions/FileAttachmentProps';
import { FileProp } from './Files/definitions/FileProp';
import { QuoteAttachment } from './QuoteAttachment';
import { AttachmentProps } from './definitions/AttachmentProps';
import { isQuoteAttachment } from './definitions/QuoteAttachmentProps';

const Item: FC<{ attachment: AttachmentProps; file?: FileProp | undefined }> = ({
	attachment,
	file,
}) => {
	if (isFileAttachment(attachment) && file) {
		return <FileAttachment {...attachment} file={file} />;
	}

	if (isQuoteAttachment(attachment)) {
		return <QuoteAttachment {...attachment} />;
	}

	return <DefaultAttachment {...(attachment as any)} />;
};

export default memo(Item);
