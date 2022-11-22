import { IMessage, isRoomFederated } from '@rocket.chat/core-typings';
import { useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import { uploadFileWithMessage } from '../../../../../app/ui/client/lib/fileUpload';
import { fileUploadIsValidContentType } from '../../../../../app/utils/client';
import { prependReplies } from '../../../../lib/utils/prependReplies';
import { useChat } from '../../contexts/ChatContext';
import { useRoom } from '../../contexts/RoomContext';
import FileUploadModal from '../../modals/FileUploadModal/FileUploadModal';

export const useUploadFiles = ({ tmid }: { tmid?: IMessage['_id'] }): ((files: readonly File[]) => Promise<void>) => {
	const room = useRoom();
	const chat = useChat();
	const threadsEnabled = useSetting('Threads_enabled') as boolean;
	const setModal = useSetModal();

	const rid = room._id;

	return useCallback(
		async (files: readonly File[]): Promise<void> => {
			const input = chat?.input;

			const replies = chat?.quotedMessages.get() ?? [];
			const mention = input ? $(input).data('mention-user') : false;

			let msg = '';

			if (!mention || !threadsEnabled) {
				msg = await prependReplies('', replies, mention);
			}

			const queue = [...files];

			const uploadNextFile = (): void => {
				const file = queue.pop();
				if (!file) {
					chat?.quotedMessages.clear();
					return;
				}

				setModal(
					<FileUploadModal
						file={file}
						fileName={file.name}
						fileDescription={input?.value ?? ''}
						showDescription={room && !isRoomFederated(room)}
						onClose={(): void => {
							setModal(null);
							uploadNextFile();
						}}
						onSubmit={(fileName: string, description?: string): void => {
							Object.defineProperty(file, 'name', {
								writable: true,
								value: fileName,
							});
							uploadFileWithMessage(
								rid,
								{
									description,
									msg,
									file,
								},
								mention && threadsEnabled && replies.length ? replies[0]._id : tmid,
							);
							chat?.setDraftAndUpdateInput('');
							setModal(null);
							uploadNextFile();
						}}
						invalidContentType={Boolean(file.type && !fileUploadIsValidContentType(file.type))}
					/>,
				);
			};

			uploadNextFile();
		},
		[chat, rid, room, setModal, threadsEnabled, tmid],
	);
};
