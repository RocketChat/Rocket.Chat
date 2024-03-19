import { isRoomFederated } from '@rocket.chat/core-typings';

import { fileUploadIsValidContentType } from '../../../../app/utils/client';
import FileUploadModal from '../../../views/room/modals/FileUploadModal';
import { imperativeModal } from '../../imperativeModal';
import { prependReplies } from '../../utils/prependReplies';
import type { ChatAPI } from '../ChatAPI';

export const uploadFiles = async (chat: ChatAPI, files: readonly File[], resetFileInput?: () => void): Promise<void> => {
	const replies = chat.composer?.quotedMessages.get() ?? [];

	const room = await chat.data.getRoom();

	const queue = [...files];

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
					const msg = await prependReplies(description || '', replies);
					chat.uploads.send(file, {
						// description,
						msg,
					});
					chat.composer?.clear();
					imperativeModal.close();
					uploadNextFile();
				},
				invalidContentType: !(file.type && fileUploadIsValidContentType(file.type)),
			},
		});
	};

	uploadNextFile();
	resetFileInput?.();
};
