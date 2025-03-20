import { type FileAttachmentProps, isFileAudioAttachment, isFileImageAttachment, isFileVideoAttachment } from '@rocket.chat/core-typings';

import AudioAttachment from './file/AudioAttachment';
import GenericFileAttachment from './file/GenericFileAttachment';
import ImageAttachment from './file/ImageAttachment';
import VideoAttachment from './file/VideoAttachment';

const FileAttachment = (attachment: FileAttachmentProps) => {
	if (isFileImageAttachment(attachment)) {
		return <ImageAttachment {...attachment} />;
	}

	if (isFileAudioAttachment(attachment)) {
		return <AudioAttachment {...attachment} />;
	}

	if (isFileVideoAttachment(attachment)) {
		return <VideoAttachment {...attachment} />;
	}

	return <GenericFileAttachment {...attachment} />;
};

export default FileAttachment;
