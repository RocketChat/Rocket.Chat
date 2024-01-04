import { useSetting } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import { useRef } from 'react';

import { useChat } from '../../../../contexts/ChatContext';

export const useFileUploadAction = () => {
	const fileUploadEnabled = useSetting('FileUpload_Enabled');
	const fileInputRef = useRef<HTMLInputElement>(null);
	const chat = useChat();

	const resetFileInput = () => {
		if (!fileInputRef.current) {
			return;
		}

		fileInputRef.current.value = '';
	};

	const handleUploadChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const { mime } = await import('../../../../../../../app/utils/lib/mimeTypes');
		const filesToUpload = Array.from(e.target.files ?? []).map((file) => {
			Object.defineProperty(file, 'type', {
				value: mime.lookup(file.name),
			});
			return file;
		});
		chat?.flows.uploadFiles(filesToUpload, resetFileInput);
	};

	const handleUpload = () => {
		fileInputRef.current?.click();
	};

	return { handleUpload, handleUploadChange, fileUploadEnabled, fileInputRef };
};
