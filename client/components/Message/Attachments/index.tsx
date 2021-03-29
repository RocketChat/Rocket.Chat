import React, { ComponentProps, FC, memo } from 'react';

import { useBlockRendered } from '../hooks/useBlockRendered';
import DefaultAttachment from './DefaultAttachment';
import { FileAttachmentProps, isFileAttachment, FileAttachment } from './Files';
import { QuoteAttachment, QuoteAttachmentProps } from './QuoteAttachment';

export type FileProp = {
	_id: string;
	name: string;
	type: string;
	format: string;
	size: number;
};

export type AttachmentProps =
	| ComponentProps<typeof DefaultAttachment>
	| FileAttachmentProps
	| QuoteAttachmentProps;

const isQuoteAttachment = (attachment: AttachmentProps): attachment is QuoteAttachmentProps =>
	'message_link' in attachment;

const Item: FC<{ attachment: AttachmentProps; file?: FileProp }> = memo(({ attachment, file }) => {
	if (isFileAttachment(attachment)) {
		return <FileAttachment {...attachment} file={file} />;
	}

	if (isQuoteAttachment(attachment)) {
		return <QuoteAttachment {...attachment} />;
	}

	return <DefaultAttachment {...(attachment as any)} />;
});

const Attachments: FC<{ attachments: Array<AttachmentProps>; file?: FileProp }> = ({
	attachments = null,
	file,
}): any => {
	const { className, ref } = useBlockRendered();
	return (
		<>
			<div className={className} ref={ref as any} />
			{attachments &&
				attachments.map((attachment, index) => (
					<Item key={index} file={file} attachment={attachment} />
				))}
		</>
	);
};

export default Attachments;
