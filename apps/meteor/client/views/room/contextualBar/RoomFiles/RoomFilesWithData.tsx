import { useLocalStorage, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useRoomToolbox } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import { useState, useCallback } from 'react';

import RoomFiles from './RoomFiles';
import { useDeleteFile } from './hooks/useDeleteFile';
import { useFilesList } from './hooks/useFilesList';
import { useRoom } from '../../contexts/RoomContext';

const RoomFilesWithData = () => {
	const room = useRoom();
	const { closeTab } = useRoomToolbox();
	const [text, setText] = useState('');
	const [type, setType] = useLocalStorage('file-list-type', 'all');

	const debouncedText = useDebouncedValue(text, 400);

	const { isPending, data, fetchNextPage, refetch } = useFilesList({
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
			loading={isPending}
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
