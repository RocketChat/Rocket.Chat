import React, { FC } from 'react';

import { isFileAudioAttachment } from '../../../../../definition/IMessage/MessageAttachment/Files/AudioAttachmentProps';
import { FileAttachmentProps } from '../../../../../definition/IMessage/MessageAttachment/Files/FileAttachmentProps';
import { isFileImageAttachment } from '../../../../../definition/IMessage/MessageAttachment/Files/ImageAttachmentProps';
import { isFileVideoAttachment } from '../../../../../definition/IMessage/MessageAttachment/Files/VideoAttachmentProps';
import { AudioAttachment } from './AudioAttachment';
import { GenericFileAttachment } from './GenericFileAttachment';
import { ImageAttachment } from './ImageAttachment';
import { VideoAttachment } from './VideoAttachment';

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

export { GenericFileAttachment, ImageAttachment, VideoAttachment };
