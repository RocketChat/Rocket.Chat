import { IconButton } from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { MessageComposerFile, MessageComposerFileError, MessageComposerFileLoader } from '@rocket.chat/ui-composer';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { MessageComposerFileItemProps } from './MessageComposerFileItem';
import { getMimeType } from '../../../../../app/utils/lib/mimeTypes';
import { getFileExtension } from '../../../../../lib/utils/getFileExtension';
import { usePreventPropagation } from '../../../../hooks/usePreventPropagation';
import { formatBytes } from '../../../../lib/utils/formatBytes';
import { useChat } from '../../contexts/ChatContext';
import FileUploadModal from '../../modals/FileUploadModal';

const MessageComposerGenericFile = ({
	upload,
	onRemove,
	onEdit,
	onCancel,
	shouldPreview,
	previewUrl,
	disabled,
	...props
}: MessageComposerFileItemProps) => {
	const { t } = useTranslation();
	const chat = useChat();
	const [isActive, setIsActive] = useState(false);
	const setModal = useSetModal();

	const fileSize = formatBytes(upload.file.size, 2);
	const fileExtension = getMimeType(upload.file.type, upload.file.name);
	const isLoading = !upload.url && !upload.error;

	const handleOpenFilePreview = () => {
		if (isLoading || upload.error) {
			return;
		}

		setModal(
			<FileUploadModal
				onSubmit={(name, description) => {
					onEdit(upload.id, name, description);
					setModal(null);
					chat?.composer?.focus();
				}}
				fileName={upload.file.name}
				fileDescription={upload.description}
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
			<MessageComposerFileError
				fileTitle={upload.file.name}
				fileFormat={getFileExtension(upload.file.name)}
				error={upload.error}
				actionIcon={actionIcon}
				onClick={handleOpenFilePreview}
			/>
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
			previewUrl={shouldPreview ? previewUrl : undefined}
			alt={upload.description}
			fileFormat={getFileExtension(upload.file.name)}
			showPreview={shouldPreview}
			actionIcon={actionIcon}
			aria-busy={isLoading}
			disabled={disabled}
			{...props}
		/>
	);
};

export default MessageComposerGenericFile;
