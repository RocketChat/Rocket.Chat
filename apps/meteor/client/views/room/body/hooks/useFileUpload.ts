import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import type { UploadsAPI } from '../../../../lib/chats/ChatAPI';
import type { Upload } from '../../../../lib/chats/Upload';
import { useChat } from '../../contexts/ChatContext';

export const useFileUpload = (store: UploadsAPI) => {
	const chat = useChat();

	if (!chat || !store) {
		throw new Error('No ChatContext provided');
	}

	useEffect(() => {
		store.wipeFailedOnes();
	}, [store]);

	const uploads = useSyncExternalStore(store.subscribe, store.get);

	const handleUploadProgressClose = useCallback(
		(id: Upload['id']) => {
			store.cancel(id);
		},
		[store],
	);

	const handleUploadFiles = useCallback(
		(files: readonly File[]): void => {
			chat?.flows.uploadFiles({ files, uploadsStore: store });
		},
		[chat, store],
	);

	const isUploading = uploads.some((upload) => upload.percentage < 100);

	return useMemo(
		() => ({
			uploads,
			hasUploads: uploads.length > 0,
			isUploading,
			handleUploadProgressClose,
			handleUploadFiles,
		}),
		[uploads, isUploading, handleUploadProgressClose, handleUploadFiles],
	);
};
