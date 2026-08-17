import type { MessageComposerFileItemProps } from './MessageComposerFileItem';
import MessageComposerGenericFile from './MessageComposerGenericFile';
import { useFileAsDataURL } from '../../hooks/useFileAsDataURL';

const MessageComposerImageFile = ({ upload, ...props }: MessageComposerFileItemProps) => {
	const [, url] = useFileAsDataURL(upload.file);

	return <MessageComposerGenericFile upload={upload} shouldPreview previewUrl={typeof url === 'string' ? url : undefined} {...props} />;
};

export default MessageComposerImageFile;
