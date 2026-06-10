import MessageComposerGenericFile from './MessageComposerGenericFile';
import MessageComposerImageFileItem from './MessageComposerImageFile';
import type { Upload } from '../../../../lib/chats/Upload';
import { MAX_FILE_SIZE_PREVIEW } from '../../../../lib/constants';
import { isPreviewableImage } from '../../../../lib/utils/isPreviewableImage';

export type MessageComposerFileItemProps = {
	upload: Upload;
	onRemove: (id: string) => void;
	onEdit: (id: Upload['id'], fileName: string, description?: string) => void;
	onCancel: (id: Upload['id']) => void;
	disabled: boolean;
	shouldPreview?: boolean;
	previewUrl?: string;
};

const MessageComposerFileItem = (props: MessageComposerFileItemProps) => {
	const shouldPreview = isPreviewableImage(props.upload.file.type) && !(props.upload.file.size > MAX_FILE_SIZE_PREVIEW);

	if (shouldPreview) {
		return <MessageComposerImageFileItem {...props} />;
	}

	return <MessageComposerGenericFile {...props} />;
};

export default MessageComposerFileItem;
