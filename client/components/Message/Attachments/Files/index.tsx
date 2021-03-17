import React, { FC } from 'react';

import { AttachmentProps, FileProp } from '..';
import { AudioAttachment, AudioAttachmentProps } from './AudioAttachment';
import { GenericFileAttachment } from './GenericFileAttachment';
import { ImageAttachment, ImageAttachmentProps } from './ImageAttachment';
// import { PDFAttachment } from './PDFAttachment';
import { VideoAttachment, VideoAttachmentProps } from './VideoAttachment';

export type FileAttachmentProps = {
	type: 'file';
	file?: FileProp;
} & (VideoAttachmentProps | ImageAttachmentProps | AudioAttachmentProps);

const isFileImageAttachment = (attachment: FileAttachmentProps): attachment is ImageAttachmentProps & { type: 'file' } => 'image_url' in attachment;
const isFileAudioAttachment = (attachment: FileAttachmentProps): attachment is AudioAttachmentProps & { type: 'file' } => 'audio_url' in attachment;
const isFileVideoAttachment = (attachment: FileAttachmentProps): attachment is VideoAttachmentProps & { type: 'file' } => 'video_url' in attachment;
// const isFilePDFAttachment = (attachment: FileAttachmentProps): attachment is VideoAttachmentProps & { type: 'file' } => attachment?.file?.type.endsWith('pdf');

export const FileAttachment: FC<FileAttachmentProps> = (attachment) => {
	if (isFileImageAttachment(attachment)) { return <ImageAttachment {...attachment} />; }
	if (isFileAudioAttachment(attachment)) { return <AudioAttachment {...attachment} />; }
	if (isFileVideoAttachment(attachment)) { return <VideoAttachment {...attachment} />; }
	// if (isFilePDFAttachment(attachment)) { return <PDFAttachment {...attachment} />; }

	return <GenericFileAttachment {...attachment}/>;
};

export const isFileAttachment = (attachment: AttachmentProps): attachment is FileAttachmentProps => 'type' in attachment && attachment.type === 'file';
