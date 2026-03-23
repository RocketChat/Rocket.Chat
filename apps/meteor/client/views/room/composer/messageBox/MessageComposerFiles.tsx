import { MessageComposerFileGroup } from '@rocket.chat/ui-composer';
import { useTranslation } from 'react-i18next';

import MessageComposerFileItem from './MessageComposerFileItem';
import { useFileUpload } from '../../body/hooks/useFileUpload';

const MessageComposerFiles = () => {
	const { t } = useTranslation();
	const { uploads, uploadsStore, isProcessingUploads, hasUploads } = useFileUpload();

	if (!uploadsStore || !hasUploads) {
		return null;
	}

	return (
		<MessageComposerFileGroup aria-label={t('Uploads')}>
			{uploads.map((upload) => (
				<MessageComposerFileItem
					key={upload.id}
					upload={upload}
					onRemove={uploadsStore.removeUpload}
					onEdit={uploadsStore.editUploadFileName}
					onCancel={uploadsStore.cancel}
					disabled={isProcessingUploads}
				/>
			))}
		</MessageComposerFileGroup>
	);
};

export default MessageComposerFiles;
