import type { MessageAttachmentBase } from '../MessageAttachmentBase';
import type { FileProp } from './FileProp';

export type PDFAttachmentProps = {
	file: FileProp;
} & MessageAttachmentBase;
