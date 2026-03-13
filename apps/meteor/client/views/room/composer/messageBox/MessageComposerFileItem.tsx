import { IconButton } from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { MessageComposerFile, MessageComposerFileError, MessageComposerFileLoader } from '@rocket.chat/ui-composer';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getMimeType } from '../../../../../app/utils/lib/mimeTypes';
import { usePreventPropagation } from '../../../../hooks/usePreventPropagation';
import type { Upload } from '../../../../lib/chats/Upload';
import { formatBytes } from '../../../../lib/utils/formatBytes';
import FileUploadModal from '../../modals/FileUploadModal';

type MessageComposerFileItemProps = {
	upload: Upload;
	onRemove: (id: string) => void;
	onEdit: (id: Upload['id'], fileName: string) => void;
	onCancel: (id: Upload['id']) => void;
	disabled: boolean;
};

const MessageComposerFileItem = ({ upload, onRemove, onEdit, onCancel, disabled, ...props }: MessageComposerFileItemProps) => {
	const { t } = useTranslation();
	const [isActive, setIsActive] = useState(false);
	const setModal = useSetModal();

	const fileSize = formatBytes(upload.file.size, 2);
	const fileExtension = getMimeType(upload.file.type, upload.file.name);
	const isLoading = upload.percentage !== 100 && !upload.error;

	const handleOpenFilePreview = () => {
		if (isLoading || upload.error) {
			return;
		}

		setModal(
			<FileUploadModal
				onSubmit={(name) => {
					onEdit(upload.id, name);
					setModal(null);
				}}
				fileName={upload.file.name}
				file={upload.file}
				onClose={() => setModal(null)}
			/>,
		);
	};

	const dismissAction = isLoading ? () => onCancel(upload.id) : () => onRemove(upload.id);
	const handleDismiss = usePreventPropagation(dismissAction);
	const buttonProps = useButtonPattern(handleDismiss);

	const actionIcon =
		isLoading && !isActive ? (
			<MessageComposerFileLoader />
		) : (
			<IconButton {...buttonProps} aria-label={isLoading ? t('Cancel') : t('Remove')} mini icon='cross' />
		);

	if (upload.error) {
		return (
			<MessageComposerFileError fileTitle={upload.file.name} error={upload.error} actionIcon={actionIcon} onClick={handleOpenFilePreview} />
		);
	}

	return (
		<MessageComposerFile
			aria-label={upload.file.name}
			onClick={handleOpenFilePreview}
			onPointerLeave={() => setIsActive(false)}
			onPointerEnter={() => setIsActive(true)}
			onFocus={() => setIsActive(true)}
			onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setIsActive(false)}
			fileTitle={upload.file.name}
			fileSubtitle={`${fileSize} - ${fileExtension}`}
			actionIcon={actionIcon}
			aria-busy={isLoading}
			disabled={disabled}
			{...props}
		/>
	);
};

export default MessageComposerFileItem;
