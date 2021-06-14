import { FileAttachmentProps } from '../Files/definitions/FileAttachmentProps';
import { DefaultAttachmentProps } from './DefaultAttachmentProps';
import { QuoteAttachmentProps } from './QuoteAttachmentProps';

export type AttachmentProps = DefaultAttachmentProps | FileAttachmentProps | QuoteAttachmentProps;
