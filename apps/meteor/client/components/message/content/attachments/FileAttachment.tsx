import { type FileAttachmentProps, isFileAudioAttachment, isFileImageAttachment, isFileVideoAttachment } from '@rocket.chat/core-typings';

import AudioAttachment from './file/AudioAttachment';
import type { AudioAttachmentSource } from './file/AudioAttachment';
import GenericFileAttachment from './file/GenericFileAttachment';
import ImageAttachment from './file/ImageAttachment';
import VideoAttachment from './file/VideoAttachment';

type FileAttachmentComponentProps = FileAttachmentProps & {
	source?: AudioAttachmentSource;
};

const FileAttachment = ({ source, ...attachment }: FileAttachmentComponentProps) => {
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
