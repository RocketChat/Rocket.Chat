import React, { FC, memo } from 'react';

import { isFileAttachment } from '@rocket.chat/core-typings';
import { FileProp } from '@rocket.chat/core-typings';
import { MessageAttachmentBase } from '@rocket.chat/core-typings';
import { isQuoteAttachment } from '@rocket.chat/core-typings';
import DefaultAttachment from './DefaultAttachment';
import { FileAttachment } from './Files';
import { QuoteAttachment } from './QuoteAttachment';

const Item: FC<{ attachment: MessageAttachmentBase; file?: FileProp | undefined }> = ({ attachment, file }) => {
	if (isFileAttachment(attachment) && file) {
		return <FileAttachment {...attachment} file={file} />;
	}

	if (isQuoteAttachment(attachment)) {
		return <QuoteAttachment {...attachment} />;
	}

	return <DefaultAttachment {...(attachment as any)} />;
};

export default memo(Item);
