import type { MessageAttachmentBase } from '@rocket.chat/core-typings';
import { isFileAttachment, isQuoteAttachment } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import { memo } from 'react';

import DefaultAttachment from './DefaultAttachment';
import FileAttachment from './FileAttachment';
import { QuoteAttachment } from './QuoteAttachment';

type AttachmentsItemProps = {
	attachment: MessageAttachmentBase;
	id: string | undefined;
	searchText?: string;
};

const AttachmentsItem = ({ attachment, id, searchText }: AttachmentsItemProps): ReactElement => {
	if (isFileAttachment(attachment)) {
		return <FileAttachment id={id} {...attachment} searchText={searchText} />;
	}

	if (isQuoteAttachment(attachment)) {
		return <QuoteAttachment attachment={attachment} searchText={searchText} />;
	}

	return <DefaultAttachment {...(attachment as any)} searchText={searchText} />;
};

export default memo(AttachmentsItem);
