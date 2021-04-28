import { ComponentProps } from 'react';

import DefaultAttachment from './DefaultAttachment';
import { FileAttachmentProps } from './Files';
import { QuoteAttachmentProps } from './QuoteAttachment';

export type AttachmentProps =
	| ComponentProps<typeof DefaultAttachment>
	| FileAttachmentProps
	| QuoteAttachmentProps;
