import { useLocalStorage, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useRoomToolbox, useStream } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ChangeEvent } from 'react';
import { useState, useCallback, useEffect } from 'react';

import RoomFiles from './RoomFiles';
import { useDeleteFile } from './hooks/useDeleteFile';
import { useFilesList } from './hooks/useFilesList';
import { roomsQueryKeys } from '../../../../lib/queryKeys';
import { useRoom } from '../../contexts/RoomContext';

const RoomFilesWithData = () => {
	const room = useRoom();
	const { closeTab } = useRoomToolbox();
	const [text, setText] = useState('');
	const [type, setType] = useLocalStorage('file-list-type', 'all');
	const queryClient = useQueryClient();
	const subscribeToRoomMessages = useStream('room-messages');
	const subscribeToNotifyRoom = useStream('notify-room');

	const debouncedText = useDebouncedValue(text, 400);

	useEffect(() => {
		const invalidateFiles = () => {
			void queryClient.invalidateQueries({
				queryKey: [...roomsQueryKeys.room(room._id), 'files'],
			});
		};

		const unsubscribeFromRoomMessages = subscribeToRoomMessages(room._id, (message) => {
			if (message.file || message.files?.length || message.t === 'rm') {
				invalidateFiles();
			}
		});
		const unsubscribeFromDeleteMessage = subscribeToNotifyRoom(`${room._id}/deleteMessage`, invalidateFiles);
		const unsubscribeFromDeleteMessageBulk = subscribeToNotifyRoom(`${room._id}/deleteMessageBulk`, invalidateFiles);

		return () => {
			unsubscribeFromRoomMessages();
			unsubscribeFromDeleteMessage();
			unsubscribeFromDeleteMessageBulk();
		};
	}, [room._id, queryClient, subscribeToRoomMessages, subscribeToNotifyRoom]);

	const { isPending, isSuccess, data, fetchNextPage, refetch } = useFilesList({
		rid: room._id,
		type,
		text: debouncedText,
	});

	const handleTextChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setText(event.currentTarget.value);
	}, []);

	const handleDeleteFile = useDeleteFile(refetch);

	return (
		<RoomFiles
			rid={room._id}
			isPending={isPending}
			isSuccess={isSuccess}
			type={type}
			text={text}
			filesItems={data?.filesItems ?? []}
			loadMoreItems={fetchNextPage}
			setType={setType}
			setText={handleTextChange}
			total={data?.total ?? 0}
			onClickClose={closeTab}
			onClickDelete={handleDeleteFile}
		/>
	);
};

export default RoomFilesWithData;
