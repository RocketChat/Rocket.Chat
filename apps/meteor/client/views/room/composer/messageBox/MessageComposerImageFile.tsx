import type { MessageComposerFileItemProps } from './MessageComposerFileItem';
import MessageComposerGenericFile from './MessageComposerGenericFile';
import { useFileAsDataURL } from '../../hooks/useFileAsDataURL';

const MessageComposerImageFile = ({ upload, ...props }: MessageComposerFileItemProps) => {
	const [, dataURL] = useFileAsDataURL(upload.file);
	const previewUrl = upload.restored ? upload.url : dataURL;

	return (
		<MessageComposerGenericFile
			upload={upload}
			shouldPreview
			previewUrl={typeof previewUrl === 'string' ? previewUrl : undefined}
			{...props}
		/>
	);
};

export default MessageComposerImageFile;
