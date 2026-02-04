import type { FileAttachmentProps } from './types';

import AudioAttachment from './file/AudioAttachment';
import GenericFileAttachment from './file/GenericFileAttachment';
import ImageAttachment from './file/ImageAttachment';
import VideoAttachment from './file/VideoAttachment';

/**
 * Detect AutoCAD / DWG files.
 * These must never be previewed as images.
 */
const isDWGFile = (attachment: FileAttachmentProps) => {
	const name = attachment.title || attachment.name || '';
	const type = attachment.type || '';

	return (
		name.toLowerCase().endsWith('.dwg') ||
		type === 'image/vnd.dwg' ||
		type === 'application/acad' ||
		type === 'application/x-acad'
	);
};

const FileAttachment = (attachment: FileAttachmentProps) => {
	// 🚨 BLOCK DWG FROM IMAGE PREVIEW
	if (isDWGFile(attachment)) {
		return <GenericFileAttachment {...attachment} />;
	}

	// image
	if (attachment.image_url) {
		return <ImageAttachment {...attachment} />;
	}

	// audio
	if (attachment.audio_url) {
		return <AudioAttachment {...attachment} />;
	}

	// video
	if (attachment.video_url) {
		return <VideoAttachment {...attachment} />;
	}

	return <GenericFileAttachment {...attachment} />;
};

export default FileAttachment;
