import type { MessageAttachmentBase } from '@rocket.chat/core-typings';
import { isFileAttachment, isQuoteAttachment } from '@rocket.chat/core-typings';
import { memo } from 'react';

import DefaultAttachment from './DefaultAttachment';
import FileAttachment from './FileAttachment';
import { QuoteAttachment } from './QuoteAttachment';
import type { AudioAttachmentSource } from './file/AudioAttachment';

export type AttachmentsItemProps = {
	attachment: MessageAttachmentBase;
	id: string | undefined;
	source?: AudioAttachmentSource;
};

const AttachmentsItem = ({ attachment, id, source }: AttachmentsItemProps) => {
	if (isFileAttachment(attachment)) {
		return <FileAttachment id={id} source={source} {...attachment} />;
	}

	if (isQuoteAttachment(attachment)) {
		return <QuoteAttachment attachment={attachment} source={source} />;
	}

	return <DefaultAttachment {...(attachment as any)} />;
};

export default memo(AttachmentsItem);
