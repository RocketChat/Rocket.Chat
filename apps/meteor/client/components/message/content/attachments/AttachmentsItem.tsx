import type { IMessage, MessageAttachmentBase } from '@rocket.chat/core-typings';
import { isFileAttachment, isQuoteAttachment } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import { memo } from 'react';

import DefaultAttachment from './DefaultAttachment';
import FileAttachment from './FileAttachment';
import { QuoteAttachment } from './QuoteAttachment';

type AttachmentsItemProps = {
	attachment: MessageAttachmentBase;
	id: string | undefined;
	mentions?: IMessage['mentions'];
};

const AttachmentsItem = ({ attachment, id, mentions }: AttachmentsItemProps): ReactElement => {
	if (isFileAttachment(attachment)) {
		return <FileAttachment id={id} {...attachment} mentions={mentions} />;
	}

	if (isQuoteAttachment(attachment)) {
		return <QuoteAttachment attachment={attachment} />;
	}

	return <DefaultAttachment {...(attachment as any)} mentions={mentions} />;
};

export default memo(AttachmentsItem);
