import { t } from '../../../../app/utils/lib/i18n';
import { MAX_MULTIPLE_UPLOADED_FILES } from '../../../../lib/constants';
import { e2e } from '../../e2ee';
import { settings } from '../../settings';
import { dispatchToastMessage } from '../../toast';
import type { ChatAPI } from '../ChatAPI';

export type ImageQualityOption = 'low' | 'medium' | 'high';

const IMAGE_QUALITY_STORAGE_KEY = 'messagebox:image-upload-quality';
const IMAGE_QUALITY_MAP: Record<ImageQualityOption, number> = {
	low: 0.25,
	medium: 0.7,
	high: 0.95,
};

export const getImageQualityOption = (): ImageQualityOption => {
	if (typeof window === 'undefined') {
		return 'medium';
	}

	const value = window.localStorage.getItem(IMAGE_QUALITY_STORAGE_KEY);

	if (value === 'low' || value === 'high' || value === 'medium') {
		return value;
	}

	return 'medium';
};

export const setImageQualityOption = (value: ImageQualityOption): void => {
	if (typeof window === 'undefined') {
		return;
	}

	window.localStorage.setItem(IMAGE_QUALITY_STORAGE_KEY, value);
};

const replaceFileExtension = (fileName: string, extension: string): string => {
	const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, '');
	return `${nameWithoutExtension}.${extension}`;
};

const compressImageFile = async (file: File): Promise<File> => {
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return file;
	}

	if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
		return file;
	}

	const quality = IMAGE_QUALITY_MAP[getImageQualityOption()];
	const targetType = file.type === 'image/png' ? 'image/webp' : file.type;
	const sourceUrl = URL.createObjectURL(file);

	try {
		const image = await new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image();

			img.onload = () => resolve(img);
			img.onerror = () => reject(new Error('Invalid image file'));
			img.src = sourceUrl;
		});

		const canvas = document.createElement('canvas');
		canvas.width = image.naturalWidth || image.width;
		canvas.height = image.naturalHeight || image.height;
		const context = canvas.getContext('2d');

		if (!context) {
			return file;
		}

		context.drawImage(image, 0, 0);

		const compressedBlob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob(resolve, targetType, quality);
		});

		if (!compressedBlob || compressedBlob.size >= file.size) {
			return file;
		}

		const nextFileName = targetType === file.type ? file.name : replaceFileExtension(file.name, 'webp');

		return new File([compressedBlob], nextFileName, {
			type: targetType,
			lastModified: file.lastModified,
		});
	} catch {
		return file;
	} finally {
		URL.revokeObjectURL(sourceUrl);
	}
};

export const uploadFiles = async (
	chat: ChatAPI,
	{ files, resetFileInput }: { files: readonly File[]; resetFileInput?: () => void },
): Promise<void> => {
	const uploadsStore = chat.composer?.uploads;
	if (!uploadsStore) {
		throw new Error('No uploads store found in composer');
	}

	const mergedFilesLength = files.length + uploadsStore.get().length;
	if (mergedFilesLength > MAX_MULTIPLE_UPLOADED_FILES) {
		return dispatchToastMessage({
			type: 'error',
			message: t('You_cant_upload_more_than__count__files', { count: MAX_MULTIPLE_UPLOADED_FILES }),
		});
	}

	const room = await chat.data.getRoom();

	if (room.encrypted && !settings.peek('E2E_Allow_Unencrypted_Messages') && !settings.peek('E2E_Enable_Encrypt_Files')) {
		return dispatchToastMessage({
			type: 'error',
			message: t('You_cant_send_unencrypted_files_in_an_encrypted_room'),
		});
	}

	const uploadFile = async (file: File) => {
		const fileToUpload = await compressImageFile(file);

		Object.defineProperty(fileToUpload, 'name', {
			writable: true,
			value: fileToUpload.name,
		});

		const e2eRoom = await e2e.getInstanceByRoomId(room._id);

		if (!e2eRoom || !settings.peek('E2E_Enable_Encrypt_Files')) {
			await uploadsStore.send(fileToUpload);
			return;
		}

		const encryptedFile = await e2eRoom.encryptFile(fileToUpload);

		if (!e2eRoom.isReady() || !encryptedFile) {
			dispatchToastMessage({
				type: 'error',
				message: t('Error_encrypting_file'),
			});
			return;
		}

		const fileContentData = {
			type: fileToUpload.type,
			typeGroup: fileToUpload.type.split('/')[0],
			name: fileToUpload.name,
			encryption: {
				key: encryptedFile.key,
				iv: encryptedFile.iv,
			},
			hashes: {
				sha256: encryptedFile.hash,
			},
		};

		const fileContent = {
			raw: fileContentData,
			encrypted: await e2eRoom.encryptMessageContent(fileContentData),
		};

		await uploadsStore.send(encryptedFile.file, { rawFile: fileToUpload, fileContent, encryptedFile });
	};

	resetFileInput?.();
	chat?.action.performContinuously('uploading');

	try {
		await Promise.allSettled(files.map((file) => uploadFile(file)));
	} finally {
		chat.composer?.focus();
	}
};
