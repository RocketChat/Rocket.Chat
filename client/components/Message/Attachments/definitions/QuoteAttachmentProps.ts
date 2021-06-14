import { AttachmentProps } from './AttachmentProps';
import { AttachmentPropsBase } from './AttachmentPropsBase';

export type QuoteAttachmentProps = {
	author_name: string;
	author_link: string;
	author_icon: string;
	message_link?: string;
	text: string;
	attachments?: Array<QuoteAttachmentProps>;
} & AttachmentPropsBase;

export const isQuoteAttachment = (
	attachment: AttachmentProps,
): attachment is QuoteAttachmentProps =>
	'message_link' in attachment && attachment.message_link !== null;
