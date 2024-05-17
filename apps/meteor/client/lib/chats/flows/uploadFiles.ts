import type { IMessage } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';

import { e2e } from '../../../../app/e2e/client';
import { fileUploadIsValidContentType } from '../../../../app/utils/client';
import FileUploadModal from '../../../views/room/modals/FileUploadModal';
import { imperativeModal } from '../../imperativeModal';
import { prependReplies } from '../../utils/prependReplies';
import type { ChatAPI } from '../ChatAPI';

export const uploadFiles = async (chat: ChatAPI, files: readonly File[], resetFileInput?: () => void): Promise<void> => {
	const replies = chat.composer?.quotedMessages.get() ?? [];

	const msg = await prependReplies('', replies);

	const room = await chat.data.getRoom();

	const queue = [...files];

	const uploadFile = (file: File, description?: string, extraData?: Pick<IMessage, 't' | 'e2e'>) => {
		chat.uploads.send(file, {
			description,
			msg,
			...extraData,
		});
		chat.composer?.clear();
		imperativeModal.close();
		uploadNextFile();
	};

	const uploadNextFile = (): void => {
		const file = queue.pop();
		if (!file) {
			chat.composer?.dismissAllQuotedMessages();
			return;
		}

		imperativeModal.open({
			component: FileUploadModal,
			props: {
				file,
				fileName: file.name,
				fileDescription: chat.composer?.text ?? '',
				showDescription: room && !isRoomFederated(room),
				onClose: (): void => {
					imperativeModal.close();
					uploadNextFile();
				},
				onSubmit: async (fileName: string, description?: string): Promise<void> => {
					Object.defineProperty(file, 'name', {
						writable: true,
						value: fileName,
					});

					// encrypt attachment description
					const e2eRoom = await e2e.getInstanceByRoomId(room._id);

					if (!e2eRoom) {
						uploadFile(file, description);
						return;
					}

					const shouldConvertSentMessages = e2eRoom.shouldConvertSentMessages({ msg });

					if (!shouldConvertSentMessages) {
						uploadFile(file, description);
						return;
					}

					const encryptedDescription = await e2eRoom.encryptAttachmentDescription(description, Random.id());

					uploadFile(file, encryptedDescription, { t: 'e2e', e2e: 'pending' });
				},
				invalidContentType: !(file.type && fileUploadIsValidContentType(file.type)),
			},
		});
	};

	uploadNextFile();
	resetFileInput?.();
};
