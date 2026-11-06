import type { MessageComposerFileItemProps } from './MessageComposerFileItem';
import MessageComposerGenericFile from './MessageComposerGenericFile';
import { getURL } from '../../../../lib/getURL';
import { useFileAsDataURL } from '../../hooks/useFileAsDataURL';

const MessageComposerImageFile = ({ upload, ...props }: MessageComposerFileItemProps) => {
	const [, dataURL] = useFileAsDataURL(upload.file);
	const previewUrl = upload.restored && upload.url ? getURL(upload.url, { full: true }) : dataURL;

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
