import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useFileInput } from '../../../../../../hooks/useFileInput';
import type { UploadsAPI } from '../../../../../../lib/chats/ChatAPI';
import { useChat } from '../../../../contexts/ChatContext';

const fileInputProps = { type: 'file', multiple: true };

export const useFileUploadAction = (disabled: boolean, uploadsStore: UploadsAPI): GenericMenuItemProps => {
	const { t } = useTranslation();
	const fileUploadEnabled = useSetting('FileUpload_Enabled', true);
	const fileInputRef = useFileInput(fileInputProps);
	const chat = useChat();

	useEffect(() => {
		const resetFileInput = () => {
			if (!fileInputRef?.current) {
				return;
			}

			fileInputRef.current.value = '';
		};

		const handleUploadChange = async () => {
			const { getMimeType } = await import('../../../../../../../app/utils/lib/mimeTypes');
			const filesToUpload = Array.from(fileInputRef?.current?.files ?? []).map((file) => {
				Object.defineProperty(file, 'type', {
					value: getMimeType(file.type, file.name),
				});
				return file;
			});
			chat?.flows.uploadFiles({ files: filesToUpload, uploadsStore, resetFileInput });
		};

		fileInputRef.current?.addEventListener('change', handleUploadChange);
		return () => fileInputRef?.current?.removeEventListener('change', handleUploadChange);
	}, [chat, fileInputRef, uploadsStore]);

	const handleUpload = () => {
		fileInputRef?.current?.click();
	};

	return {
		id: 'file-upload',
		content: t('Upload_file'),
		icon: 'clip',
		onClick: handleUpload,
		disabled: !fileUploadEnabled || disabled,
	};
};
