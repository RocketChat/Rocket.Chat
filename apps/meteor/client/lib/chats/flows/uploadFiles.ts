import { isRoomFederated } from '@rocket.chat/core-typings';

import { fileUploadIsValidContentType } from '../../../../app/utils/client';
import FileUploadModal from '../../../views/room/modals/FileUploadModal';
import { imperativeModal } from '../../imperativeModal';
import { prependReplies } from '../../utils/prependReplies';
import type { ChatAPI } from '../ChatAPI';

export const uploadFiles = async (chat: ChatAPI, files: readonly File[]): Promise<void> => {
	const replies = chat.composer?.quotedMessages.get() ?? [];

	const msg = await prependReplies('', replies);

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
				onSubmit: (fileName: string, description?: string): void => {
					Object.defineProperty(file, 'name', {
						writable: true,
						value: fileName,
					});
					chat.uploads.send(file, {
						description,
						msg,
					});
					chat.composer?.clear();
					imperativeModal.close();
					uploadNextFile();
				},
				invalidContentType: Boolean(file.type && !fileUploadIsValidContentType(file.type)),
			},
		});
	};

	uploadNextFile();
};
