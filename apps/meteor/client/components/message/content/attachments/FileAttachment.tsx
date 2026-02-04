import type { FileAttachmentProps } from './types';

import AudioAttachment from './file/AudioAttachment';
import GenericFileAttachment from './file/GenericFileAttachment';
import ImageAttachment from './file/ImageAttachment';
import VideoAttachment from './file/VideoAttachment';

const isDWGFile = (attachment: FileAttachmentProps) => {
	const name = attachment.title || attachment.name || '';
	const type = (attachment.type || '').toLowerCase().trim();

	return (
		name.toLowerCase().endsWith('.dwg') ||
		type === 'image/vnd.dwg' ||
		type === 'application/acad' ||
		type === 'application/x-acad'
	);
};

const FileAttachment = (attachment: FileAttachmentProps) => {
	if (isDWGFile(attachment)) {
		return <GenericFileAttachment {...attachment} />;
	}

	if (attachment.image_url) {
		return <ImageAttachment {...attachment} />;
	}

	if (attachment.audio_url) {
		return <AudioAttachment {...attachment} />;
	}

	if (attachment.video_url) {
		return <VideoAttachment {...attachment} />;
	}

	return <GenericFileAttachment {...attachment} />;
};

export default FileAttachment;
