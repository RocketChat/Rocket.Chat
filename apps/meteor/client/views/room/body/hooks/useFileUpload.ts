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

	// Follows the composer as it comes and goes, so its uploads are attached as soon as it exists.
	const getComposer = useCallback(() => chat.composer, [chat]);
	const store = useSyncExternalStore(chat.subscribeToComposer, getComposer)?.uploads;

	const uploads = useSyncExternalStore(store?.subscribe ?? emptySubscribe, store?.get ?? getEmptyUploads);
	const isProcessingUploads = useSyncExternalStore(store?.subscribe ?? emptySubscribe, store?.getProcessingUploads ?? getEmptyBool);

	useEffect(() => {
		store?.attach();
		store?.wipeFailedOnes();

		return () => store?.detach();
	}, [chat.action, store]);

	const handleUploadFiles = useCallback(
		(files: readonly File[]): void => {
			chat.flows.uploadFiles({ files });
		},
		[chat],
	);

	const isUploading = uploads.length > 0 && uploads.some((upload) => !upload.url && !upload.error);

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
