import { t } from '../../../../app/utils/lib/i18n';
import { MAX_MULTIPLE_UPLOADED_FILES } from '../../../../lib/constants';
import { e2e } from '../../e2ee';
import { settings } from '../../settings';
import { dispatchToastMessage } from '../../toast';
import type { ChatAPI, UploadsAPI, EncryptedFileUploadContent } from '../ChatAPI';

export const uploadFiles = async (
	chat: ChatAPI,
	{ files, uploadsStore, resetFileInput }: { files: readonly File[]; uploadsStore: UploadsAPI; resetFileInput?: () => void },
): Promise<void> => {
	const mergedFilesLength = files.length + uploadsStore.get().length;
	if (mergedFilesLength > MAX_MULTIPLE_UPLOADED_FILES) {
		return dispatchToastMessage({
			type: 'error',
			message: t('You_cant_upload_more_than__count__files', { count: MAX_MULTIPLE_UPLOADED_FILES }),
		});
	}

	const room = await chat.data.getRoom();
	const queue = [...files];

	const uploadFile = async (file: File, encrypted?: EncryptedFileUploadContent) => {
		if (encrypted) {
			await uploadsStore.send(file, encrypted);
		} else {
			await uploadsStore.send(file);
		}

		await uploadNextFile();
	};

	const uploadNextFile = async (): Promise<void> => {
		const file = queue.shift();
		if (!file) {
			chat.composer?.dismissAllQuotedMessages();
			return;
		}

		Object.defineProperty(file, 'name', {
			writable: true,
			value: file.name,
		});

		const e2eRoom = await e2e.getInstanceByRoomId(room._id);

		if (!e2eRoom?.isReady() || !settings.peek('E2E_Enable_Encrypt_Files')) {
			await uploadFile(file);
			return;
		}

		const encryptedFile = await e2eRoom.encryptFile(file);

		if (!encryptedFile) {
			dispatchToastMessage({
				type: 'error',
				message: t('Error_encrypting_file'),
			});

			await uploadNextFile();
			return;
		}

		const fileContentData = {
			type: file.type,
			typeGroup: file.type.split('/')[0],
			name: file.name,
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

		await uploadFile(encryptedFile.file, { rawFile: file, fileContent, encryptedFile });
	};

	resetFileInput?.();
	chat?.action.performContinuously('uploading');
	await uploadNextFile();
};
