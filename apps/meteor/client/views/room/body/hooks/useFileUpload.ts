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
	const isProcessingUploads = useSyncExternalStore(store.subscribe, store.getProcessingUploads);

	const stopUploadingAction = useCallback(() => {
		if (uploads.length === 1) {
			chat.action.stop('uploading');
		}
	}, [chat.action, uploads.length]);

	const handleRemoveUpload = useCallback(
		(id: Upload['id']) => {
			store.removeUpload(id);
			stopUploadingAction();
		},
		[stopUploadingAction, store],
	);

	const handleCancelUpload = useCallback(
		(id: Upload['id']) => {
			store.cancel(id);
			stopUploadingAction();
		},
		[stopUploadingAction, store],
	);

	const handleEditUpload = useCallback((id: Upload['id'], fileName: string) => store.editUploadFileName(id, fileName), [store]);

	const handlePauseUpload = useCallback((id: Upload['id']) => store.pause(id), [store]);

	const handleResumeUpload = useCallback((id: Upload['id']) => store.resume(id), [store]);

	const handleUploadFiles = useCallback(
		(files: readonly File[]): void => {
			chat?.flows.uploadFiles({ files, uploadsStore: store });
		},
		[chat, store],
	);

	const isUploading = uploads.length > 0 && uploads.some((upload) => upload.percentage < 100 && !upload.error);

	return useMemo(
		() => ({
			uploads,
			hasUploads: uploads.length > 0,
			isUploading,
			isProcessingUploads,
			handleRemoveUpload,
			handleEditUpload,
			handleCancelUpload,
			handlePauseUpload,
			handleResumeUpload,
			handleUploadFiles,
		}),
		[
			uploads,
			isUploading,
			isProcessingUploads,
			handleRemoveUpload,
			handleEditUpload,
			handleCancelUpload,
			handlePauseUpload,
			handleResumeUpload,
			handleUploadFiles,
		],
	);
};
