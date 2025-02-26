import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { useFileUploadDropTarget } from './useFileUploadDropTarget';
import type { Upload } from '../../../../lib/chats/Upload';
import { useChat } from '../../contexts/ChatContext';

export const useFileUpload = () => {
	const chat = useChat();
	if (!chat) {
		throw new Error('No ChatContext provided');
	}

	useEffect(() => {
		chat.uploads.wipeFailedOnes();
	}, [chat]);

	const uploads = useSyncExternalStore(chat.uploads.subscribe, chat.uploads.get);

	const handleUploadProgressClose = useCallback(
		(id: Upload['id']) => {
			chat.uploads.cancel(id);
		},
		[chat],
	);

	const handleUploadFiles = useCallback(
		(files: readonly File[]): void => {
			chat.flows.uploadFiles(files);
		},
		[chat],
	);

	return {
		uploads,
		handleUploadProgressClose,
		handleUploadFiles,
		targeDrop: useFileUploadDropTarget(),
	};
};
