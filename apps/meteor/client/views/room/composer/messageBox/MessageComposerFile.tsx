import { IconButton } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import type { AllHTMLAttributes, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import MessageComposerFileComponent from './MessageComposerFileComponent';
import MessageComposerFileError from './MessageComposerFileError';
import MessageComposerFileLoader from './MessageComposerFileLoader';
import { getMimeType } from '../../../../../app/utils/lib/mimeTypes';
import { usePreventPropagation } from '../../../../hooks/usePreventPropagation';
import type { Upload } from '../../../../lib/chats/Upload';
import { formatBytes } from '../../../../lib/utils/formatBytes';
import FileUploadModal from '../../modals/FileUploadModal';

type MessageComposerFileProps = {
	upload: Upload;
	onRemove: (id: string) => void;
	onEdit: (id: Upload['id'], fileName: string) => void;
	onCancel: (id: Upload['id']) => void;
} & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const MessageComposerFile = ({ upload, onRemove, onEdit, onCancel, ...props }: MessageComposerFileProps): ReactElement => {
	const { t } = useTranslation();
	const [isHover, setIsHover] = useState(false);
	const setModal = useSetModal();

	const fileSize = formatBytes(upload.file.size, 2);
	const fileExtension = getMimeType(upload.file.type, upload.file.name);
	const isLoading = upload.percentage !== 100 && !upload.error;

	const handleOpenFilePreview = () => {
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

	const actionIcon =
		isLoading && !isHover ? (
			<MessageComposerFileLoader />
		) : (
			<IconButton aria-label={t('Close')} onClick={handleDismiss} mini icon='cross' />
		);

	if (upload.error) {
		return <MessageComposerFileError fileTitle={upload.file.name} error={upload.error} actionIcon={actionIcon} />;
	}

	return (
		<MessageComposerFileComponent
			aria-label={upload.file.name}
			onClick={handleOpenFilePreview}
			onKeyDown={(e) => ['Enter', 'Space'].includes(e.code) && handleOpenFilePreview()}
			onMouseLeave={() => setIsHover(false)}
			onMouseEnter={() => setIsHover(true)}
			fileTitle={upload.file.name}
			fileSubtitle={`${fileSize} - ${fileExtension}`}
			actionIcon={actionIcon}
			aria-busy={isLoading}
			{...props}
		/>
	);
};

export default MessageComposerFile;
