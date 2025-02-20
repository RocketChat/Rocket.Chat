import { e2e } from '../../../../app/e2e/client';
import { settings } from '../../../../app/settings/client';
import { t } from '../../../../app/utils/lib/i18n';
import { MAX_MULTIPLE_UPLOADED_FILES } from '../../constants';
import { dispatchToastMessage } from '../../toast';
// import { prependReplies } from '../../utils/prependReplies';
import type { ChatAPI, UploadsAPI, EncryptedFileUploadContent } from '../ChatAPI';

export const uploadFiles = async (
	chat: ChatAPI,
	{ files, uploadsStore, resetFileInput }: { files: readonly File[]; uploadsStore: UploadsAPI; resetFileInput?: () => void },
): Promise<void> => {
	// TODO: calculate max files based on the new array and the files in the queue
	if (uploadsStore.get().length > MAX_MULTIPLE_UPLOADED_FILES) {
		return dispatchToastMessage({
			type: 'error',
			message: t('You_cant_upload_more_than__count__files', { count: 10 }),
		});
	}

	// const replies = chat.composer?.quotedMessages.get() ?? [];

	// const msg = await prependReplies('', replies);

	const room = await chat.data.getRoom();

	const queue = [...files];

	const uploadFile = (file: File, encrypted?: EncryptedFileUploadContent) => {
		if (encrypted) {
			uploadsStore.send(file, encrypted);
		} else {
			uploadsStore.send(file);
		}

		uploadNextFile();
	};

	const uploadNextFile = async (): Promise<void> => {
		const file = queue.pop();
		if (!file) {
			chat.composer?.dismissAllQuotedMessages();
			return;
		}

		Object.defineProperty(file, 'name', {
			writable: true,
			value: file.name,
		});

		const e2eRoom = await e2e.getInstanceByRoomId(room._id);

		if (!e2eRoom || !settings.get('E2E_Enable_Encrypt_Files')) {
			uploadFile(file);
			return;
		}

		if (!(await e2eRoom.readyToEncrypt())) {
			uploadFile(file);
			return;
		}

		const encryptedFile = await e2eRoom.encryptFile(file);

		if (encryptedFile) {
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

			uploadFile(encryptedFile.file, { rawFile: file, fileContent, encryptedFile });
		}
	};

	uploadNextFile();
	resetFileInput?.();
};
