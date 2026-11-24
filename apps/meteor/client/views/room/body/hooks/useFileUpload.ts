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
	const composer = useSyncExternalStore(chat.subscribeToComposer, getComposer);
	const store = composer?.uploads;
	const isEditing = useSyncExternalStore(composer?.editing.subscribe ?? emptySubscribe, composer?.editing.get ?? getEmptyBool);

	// Uploads are put aside while a message is edited, and come back as they are once the edit ends.
	const storedUploads = useSyncExternalStore(store?.subscribe ?? emptySubscribe, store?.get ?? getEmptyUploads);
	const uploads = isEditing ? emptyUploads : storedUploads;
	const storeIsProcessingUploads = useSyncExternalStore(store?.subscribe ?? emptySubscribe, store?.getProcessingUploads ?? getEmptyBool);
	const isProcessingUploads = !isEditing && storeIsProcessingUploads;

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
