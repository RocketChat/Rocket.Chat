import type { FileAttachmentProps } from '@rocket.chat/core-typings';
import { isFileAudioAttachment, isFileImageAttachment, isFileVideoAttachment } from '@rocket.chat/core-typings';

import AudioAttachment from './AudioAttachment';
import GenericFileAttachment from './GenericFileAttachment';
import ImageAttachment from './ImageAttachment';
import PdfAttachment from './PdfAttachment';
import VideoAttachment from './VideoAttachment';

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

    // Check if it's a PDF by format field (case-insensitive)
    if ((attachment as any).format?.toUpperCase() === 'PDF') {
        return <PdfAttachment {...attachment} />;
    }

    return <GenericFileAttachment {...attachment} />;
};

export default FileAttachment;