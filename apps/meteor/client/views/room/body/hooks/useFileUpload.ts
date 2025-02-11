import fileSize from 'filesize';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { useFileUploadDropTarget } from './useFileUploadDropTarget';
import type { Upload } from '../../../../lib/chats/Upload';
import { useChat } from '../../contexts/ChatContext';

type HandleFilesToUpload = (filesList: File[], resetFileInput?: () => void) => void;

export const useFileUpload = () => {
	// const dispatchToastMessage = useToastMessageDispatch();
	// const maxFileSize = useSetting('FileUpload_MaxFileSize') as number;
	// const [isUploading, setIsUploading] = useState(false);

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
		isUploading: uploads.length > 0,
		handleUploadProgressClose,
		handleUploadFiles,
		targeDrop: useFileUploadDropTarget(),
	};
};

// const handleFilesToUpload: HandleFilesToUpload = (filesList: File[], resetFileInput?: () => void) => {
// 	setFilesToUpload((prevFiles: File[]) => {
// 		let newFilesToUpload = [...prevFiles, ...filesList];
// 		if (newFilesToUpload.length > 6) {
// 			newFilesToUpload = newFilesToUpload.slice(0, 6);
// 			dispatchToastMessage({
// 				type: 'error',
// 				message: "You can't upload more than 6 files at once. Only the first 6 files will be uploaded.",
// 			});
// 		}
// 		let nameError = 0;
// 		let sizeError = 0;

// 		const validFiles = newFilesToUpload.filter((queuedFile) => {
// 			const { name, size } = queuedFile;

// 			if (!name) {
// 				nameError = 1;
// 				return false;
// 			}

// 			if (maxFileSize > -1 && (size || 0) > maxFileSize) {
// 				sizeError = 1;
// 				return false;
// 			}

// 			return true;
// 		});

// 		if (nameError) {
// 			dispatchToastMessage({
// 				type: 'error',
// 				message: t('error-the-field-is-required', { field: t('Name') }),
// 			});
// 		}

// 		if (sizeError) {
// 			dispatchToastMessage({
// 				type: 'error',
// 				message: `${t('File_exceeds_allowed_size_of_bytes', { size: fileSize(maxFileSize) })}`,
// 			});
// 		}

// 		setIsUploading(validFiles.length > 0);
// 		return validFiles;
// 	});

// 	resetFileInput?.();
// };
