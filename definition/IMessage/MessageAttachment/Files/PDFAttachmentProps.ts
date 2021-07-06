
import { MessageAttachmentBase } from '../MessageAttachmentBase';
import { FileProp } from './FileProp';

export type PDFAttachmentProps = {
	file: FileProp;
} & MessageAttachmentBase;
