import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import type { Upload } from '../../../../lib/chats/Upload';
import { useChat } from '../../contexts/ChatContext';

const emptySubscribe = () => () => undefined;
const emptyUploads: readonly Upload[] = [];
const getEmptyUploads = () => emptyUploads;
const getEmptyBool = () => false;

export const useFileUpload = () => {
	const chat = useChat();

	if (!chat) {
		throw new Error('No ChatContext provided');
	}

	const store = chat.composer?.uploads;

	const uploads = useSyncExternalStore(store?.subscribe ?? emptySubscribe, store?.get ?? getEmptyUploads);
	const isProcessingUploads = useSyncExternalStore(store?.subscribe ?? emptySubscribe, store?.getProcessingUploads ?? getEmptyBool);

	useEffect(() => {
		store?.wipeFailedOnes();

		return () => store?.clear();
	}, [chat.action, store]);

	const handleUploadFiles = useCallback(
		(files: readonly File[]): void => {
			chat.flows.uploadFiles({ files });
		},
		[chat],
	);

	const isUploading = uploads.length > 0 && uploads.some((upload) => upload.percentage < 100 && !upload.error);

	return useMemo(
		() => ({
			uploadsStore: store,
			uploads,
			hasUploads: uploads.length > 0,
			isUploading,
			isProcessingUploads,
			handleUploadFiles,
		}),
		[store, uploads, isUploading, isProcessingUploads, handleUploadFiles],
	);
};
