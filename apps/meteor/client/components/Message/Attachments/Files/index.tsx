import React, { FC } from 'react';

import { isFileAudioAttachment } from '@rocket.chat/core-typings';
import { FileAttachmentProps } from '@rocket.chat/core-typings';
import { isFileImageAttachment } from '@rocket.chat/core-typings';
import { isFileVideoAttachment } from '@rocket.chat/core-typings';
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
