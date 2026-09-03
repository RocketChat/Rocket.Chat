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
	path: string;
	source?: AudioAttachmentSource;
};

const AttachmentsItem = ({ attachment, id, path, source }: AttachmentsItemProps) => {
	if (isFileAttachment(attachment)) {
		return <FileAttachment id={id} source={source} {...attachment} />;
	}

	if (isQuoteAttachment(attachment)) {
		return <QuoteAttachment attachment={attachment} source={source} path={path} />;
	}

	return <DefaultAttachment {...attachment} collapseKey={source?.mid ? `${source.mid}-${path}` : undefined} />;
};

export default memo(AttachmentsItem);
