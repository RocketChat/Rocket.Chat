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

	let value: string | null = null;
	try {
		value = window.localStorage.getItem(IMAGE_QUALITY_STORAGE_KEY);
	} catch {
		return 'medium';
	}

	if (value === 'low' || value === 'high' || value === 'medium') {
		return value;
	}

	return 'medium';
};

export const setImageQualityOption = (value: ImageQualityOption): ImageQualityOption => {
	if (typeof window === 'undefined') {
		return 'medium';
	}

	try {
		window.localStorage.setItem(IMAGE_QUALITY_STORAGE_KEY, value);
		return getImageQualityOption();
	} catch {
		return 'medium';
	}
};

const replaceFileExtension = (fileName: string, extension: string): string => {
	const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, '');
	return `${nameWithoutExtension}.${extension}`;
};

const readUint32BE = (bytes: Uint8Array, offset: number): number | null => {
	if (offset < 0 || offset + 4 > bytes.length) {
		return null;
	}

	return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
};

const readUint32LE = (bytes: Uint8Array, offset: number): number | null => {
	if (offset < 0 || offset + 4 > bytes.length) {
		return null;
	}

	return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
};

const isAnimatedPng = (bytes: Uint8Array): boolean => {
	const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
	if (!pngSignature.every((value, index) => bytes[index] === value)) {
		return false;
	}

	let offset = 8;
	while (offset + 8 <= bytes.length) {
		const chunkLength = readUint32BE(bytes, offset);
		if (chunkLength === null) {
			return false;
		}

		const nextOffset = offset + 12 + chunkLength;
		if (nextOffset <= offset || nextOffset > bytes.length) {
			return false;
		}

		const typeStart = offset + 4;
		const chunkType = String.fromCharCode(
			bytes[typeStart],
			bytes[typeStart + 1],
			bytes[typeStart + 2],
			bytes[typeStart + 3],
		);

		if (chunkType === 'acTL') {
			return true;
		}

		if (chunkType === 'IDAT') {
			return false;
		}

		offset = nextOffset;
	}

	return false;
};

const isAnimatedWebP = (bytes: Uint8Array): boolean => {
	if (bytes.length < 16) {
		return false;
	}

	const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
	const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
	if (riff !== 'RIFF' || webp !== 'WEBP') {
		return false;
	}

	let offset = 12;
	while (offset + 8 <= bytes.length) {
		const chunkType = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
		const chunkLength = readUint32LE(bytes, offset + 4);
		if (chunkLength === null) {
			return false;
		}

		const nextOffset = offset + 8 + chunkLength + (chunkLength % 2);
		if (nextOffset <= offset || nextOffset > bytes.length) {
			return false;
		}

		if (chunkType === 'ANIM' || chunkType === 'ANMF') {
			return true;
		}

		if (chunkType === 'VP8X' && offset + 9 <= bytes.length) {
			const featureFlags = bytes[offset + 8];
			if ((featureFlags & 0x02) !== 0) {
				return true;
			}
		}

		offset = nextOffset;
	}

	return false;
};

const isAnimatedImage = async (file: File): Promise<boolean> => {
	if (file.type !== 'image/png' && file.type !== 'image/webp') {
		return false;
	}

	try {
		const buffer = await file.arrayBuffer();
		const bytes = new Uint8Array(buffer);

		if (file.type === 'image/png') {
			return isAnimatedPng(bytes);
		}

		return isAnimatedWebP(bytes);
	} catch {
		return false;
	}
};

const compressImageFile = async (file: File): Promise<File> => {
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return file;
	}

	if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
		return file;
	}

	if (await isAnimatedImage(file)) {
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

		if (!compressedBlob || compressedBlob.size >= file.size || compressedBlob.type.toLowerCase() !== targetType.toLowerCase()) {
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
