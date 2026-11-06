import MessageComposerGenericFile from './MessageComposerGenericFile';
import MessageComposerImageFileItem from './MessageComposerImageFile';
import { isEncryptedUpload, type Upload } from '../../../../lib/chats/Upload';
import { MAX_FILE_SIZE_PREVIEW } from '../../../../lib/constants';
import { isPreviewableImage } from '../../../../lib/utils/isPreviewableImage';

export type MessageComposerFileItemProps = {
	upload: Upload;
	onRemove: (id: string) => void;
	onEdit: (id: Upload['id'], fileName: string, altText?: string) => void;
	onCancel: (id: Upload['id']) => void;
	disabled: boolean;
	shouldPreview?: boolean;
	previewUrl?: string;
};

const MessageComposerFileItem = (props: MessageComposerFileItemProps) => {
	const { upload } = props;
	// A restored encrypted upload has only ciphertext on the server, so there is nothing to show as a thumbnail.
	const shouldPreview =
		isPreviewableImage(upload.file.type) && !(upload.file.size > MAX_FILE_SIZE_PREVIEW) && !(upload.restored && isEncryptedUpload(upload));

	if (shouldPreview) {
		return <MessageComposerImageFileItem {...props} />;
	}

	return <MessageComposerGenericFile {...props} />;
};

export default MessageComposerFileItem;
