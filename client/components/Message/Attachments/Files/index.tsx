import React, { FC } from 'react';

import { AudioAttachment } from './AudioAttachment';
import { GenericFileAttachment } from './GenericFileAttachment';
import { ImageAttachment } from './ImageAttachment';
import { VideoAttachment } from './VideoAttachment';
import { isFileAudioAttachment } from './definitions/AudioAttachmentProps';
import { FileAttachmentProps } from './definitions/FileAttachmentProps';
import { isFileImageAttachment } from './definitions/ImageAttachmentProps';
import { isFileVideoAttachment } from './definitions/VideoAttachmentProps';
// import { PDFAttachment } from './PDFAttachment';

// const isFilePDFAttachment = (attachment: FileAttachmentProps): attachment is VideoAttachmentProps & { type: 'file' } => attachment?.file?.type.endsWith('pdf');

export const FileAttachment: FC<FileAttachmentProps> = (attachment) => {
	if (isFileImageAttachment(attachment)) {
		return <ImageAttachment {...attachment} />;
	}
	if (isFileAudioAttachment(attachment)) {
		return <AudioAttachment {...attachment} />;
	}
	if (isFileVideoAttachment(attachment)) {
		return <VideoAttachment {...attachment} />;
	}
	// if (isFilePDFAttachment(attachment)) { return <PDFAttachment {...attachment} />; }

	return <GenericFileAttachment {...attachment} />;
};
