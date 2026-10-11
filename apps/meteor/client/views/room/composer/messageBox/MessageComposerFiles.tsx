import { MessageComposerFileGroup } from '@rocket.chat/ui-composer';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import MessageComposerFileItem from './MessageComposerFileItem';
import type { Upload } from '../../../../lib/chats/Upload';
import { useFileUpload } from '../../body/hooks/useFileUpload';

const MessageComposerFiles = () => {
	const { t } = useTranslation();
	const { uploads, uploadsStore, isProcessingUploads, hasUploads } = useFileUpload();

	const handleEdit = useCallback(
		(id: Upload['id'], fileName: string, altText?: string) => {
			uploadsStore?.editUploadFileName(id, fileName);
			if (altText !== undefined) {
				uploadsStore?.editUploadAltText(id, altText);
			}
		},
		[uploadsStore],
	);

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
					onEdit={handleEdit}
					onCancel={uploadsStore.cancel}
					disabled={isProcessingUploads}
				/>
			))}
		</MessageComposerFileGroup>
	);
};

export default MessageComposerFiles;
