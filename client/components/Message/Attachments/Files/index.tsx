import React, { FC } from 'react';

import { AttachmentPropsGeneric } from '..';
import { AudioAttachment, AudioAttachmentProps } from './AudioAttachment';
import { ImageAttachment, ImageAttachmentProps } from './ImageAttachment';
import { VideoAttachment, VideoAttachmentProps } from './VideoAttachment';

export type FileAttachmentProps = { type: 'file' } & (VideoAttachmentProps | ImageAttachmentProps | AudioAttachmentProps);

const isFileImageAttachment = (attachment: FileAttachmentProps): attachment is ImageAttachmentProps & { type: 'file' } => 'image_url' in attachment;
const isFileAudioAttachment = (attachment: FileAttachmentProps): attachment is AudioAttachmentProps & { type: 'file' } => 'audio_url' in attachment;
const isFileVideoAttachment = (attachment: FileAttachmentProps): attachment is VideoAttachmentProps & { type: 'file' } => 'video_url' in attachment;

export const FileAttachment: FC<FileAttachmentProps> = (attachment) => {
	if (isFileImageAttachment(attachment)) { return <ImageAttachment {...attachment} />; }
	if (isFileAudioAttachment(attachment)) { return <AudioAttachment {...attachment} />; }
	if (isFileVideoAttachment(attachment)) { return <VideoAttachment {...attachment} />; }
	return null;
};

export const isFileAttachment = (attachment: AttachmentPropsGeneric): attachment is FileAttachmentProps => 'type' in attachment && attachment.type === 'file';
