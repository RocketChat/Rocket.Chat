import { useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useFileInput } from '../../../../../../hooks/useFileInput';
import { useChat } from '../../../../contexts/ChatContext';
import type { ToolbarAction } from './ToolbarAction';

const fileInputProps = { type: 'file', multiple: true };

export const useFileUploadAction = (disabled: boolean): ToolbarAction => {
	const t = useTranslation();
	const fileUploadEnabled = useSetting('FileUpload_Enabled');
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
			const { mime } = await import('../../../../../../../app/utils/lib/mimeTypes');
			const filesToUpload = Array.from(fileInputRef?.current?.files ?? []).map((file) => {
				Object.defineProperty(file, 'type', {
					value: mime.lookup(file.name),
				});
				return file;
			});
			chat?.flows.uploadFiles(filesToUpload, resetFileInput);
		};

		fileInputRef.current?.addEventListener('change', handleUploadChange);
		return () => fileInputRef?.current?.removeEventListener('change', handleUploadChange);
	}, [chat, fileInputRef]);

	const handleUpload = () => {
		fileInputRef?.current?.click();
	};

	return {
		id: 'file-upload',
		icon: 'clip',
		label: t('File'),
		title: t('File'),
		onClick: handleUpload,
		disabled: !fileUploadEnabled || disabled,
	};
};
