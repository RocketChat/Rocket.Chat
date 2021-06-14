import { FileProp } from '../..';
import { AttachmentPropsBase } from '../../definitions/AttachmentPropsBase';

export type PDFAttachmentProps = {
	file: FileProp;
} & AttachmentPropsBase;
