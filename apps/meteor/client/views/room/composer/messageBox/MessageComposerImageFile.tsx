import type { MessageComposerFileItemProps } from './MessageComposerFileItem';
import MessageComposerGenericFile from './MessageComposerGenericFile';
import { useFileAsDataURL } from '../../hooks/useFileAsDataURL';

export type MessageComposerImageFileProps = MessageComposerFileItemProps;

const MessageComposerImageFile = ({ upload, ...props }: MessageComposerImageFileProps) => {
	const [, url] = useFileAsDataURL(upload.file);

	return <MessageComposerGenericFile upload={upload} shouldPreview previewUrl={typeof url === 'string' ? url : undefined} {...props} />;
};

export default MessageComposerImageFile;
