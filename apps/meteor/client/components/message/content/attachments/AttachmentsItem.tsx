import type { MessageAttachmentBase } from '@rocket.chat/core-typings';
import { isFileAttachment, isQuoteAttachment } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import DefaultAttachment from './DefaultAttachment';
import FileAttachment from './FileAttachment';
import { QuoteAttachment } from './QuoteAttachment';

type AttachmentsItemProps = {
	attachment: MessageAttachmentBase;
	id: string | undefined;
	isMessageEncrypted: boolean;
};

const AttachmentsItem = ({ attachment, id, isMessageEncrypted }: AttachmentsItemProps): ReactElement => {
	if (isFileAttachment(attachment)) {
		return <FileAttachment id={id} {...attachment} isMessageEncrypted={isMessageEncrypted} />;
	}

	if (isQuoteAttachment(attachment)) {
		return <QuoteAttachment attachment={attachment} />;
	}

	return <DefaultAttachment {...(attachment as any)} />;
};

export default memo(AttachmentsItem);
