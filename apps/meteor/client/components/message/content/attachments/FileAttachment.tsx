import { type FileAttachmentProps, isFileAudioAttachment, isFileImageAttachment, isFileVideoAttachment } from '@rocket.chat/core-typings';

import AudioAttachment from './file/AudioAttachment';
import type { AudioAttachmentSource } from './file/AudioAttachment';
import GenericFileAttachment from './file/GenericFileAttachment';
import ImageAttachment from './file/ImageAttachment';
import VideoAttachment from './file/VideoAttachment';

const FileAttachment = ({ source, ...attachment }: FileAttachmentProps & { source?: AudioAttachmentSource }) => {
	if (isFileImageAttachment(attachment)) {
		return <ImageAttachment {...attachment} />;
	}

	if (isFileAudioAttachment(attachment)) {
		return <AudioAttachment {...attachment} source={source} />;
	}

	if (isFileVideoAttachment(attachment)) {
		return <VideoAttachment {...attachment} />;
	}

	return <GenericFileAttachment {...attachment} />;
};

export default FileAttachment;
