import { IMessage, isRoomFederated } from '@rocket.chat/core-typings';
import { useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import { ChatMessages } from '../../../../../app/ui/client';
import { uploadFileWithMessage } from '../../../../../app/ui/client/lib/fileUpload';
import { fileUploadIsValidContentType } from '../../../../../app/utils/client';
import { prependReplies } from '../../../../lib/utils/prependReplies';
import { ChatAPI } from '../../contexts/ChatContext';
import { useRoom } from '../../contexts/RoomContext';
import FileUploadModal from '../../modals/FileUploadModal/FileUploadModal';

export const useUploadFiles = ({
	chatMessages,
	tmid,
	composer,
}: {
	/** @deprecated bad coupling */
	chatMessages: ChatMessages;
	tmid?: IMessage['_id'];
	composer: ChatAPI['composer'];
}): ((files: readonly File[]) => Promise<void>) => {
	const room = useRoom();
	const threadsEnabled = useSetting('Threads_enabled') as boolean;
	const setModal = useSetModal();

	const rid = room._id;

	return useCallback(
		async (files: readonly File[]): Promise<void> => {
			const input = chatMessages?.input;

			const replies = composer.quotedMessages.get();
			const mention = input ? $(input).data('mention-user') : false;

			let msg = '';

			if (!mention || !threadsEnabled) {
				msg = await prependReplies('', replies, mention);
			}

			const queue = [...files];

			const uploadNextFile = (): void => {
				const file = queue.pop();
				if (!file) {
					composer.dismissAllQuotedMessages();
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
							chatMessages?.setDraftAndUpdateInput('');
							setModal(null);
							uploadNextFile();
						}}
						invalidContentType={Boolean(file.type && !fileUploadIsValidContentType(file.type))}
					/>,
				);
			};

			uploadNextFile();
		},
		[chatMessages, composer, rid, room, setModal, threadsEnabled, tmid],
	);
};
