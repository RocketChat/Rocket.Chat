import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent } from 'react';
import { useState, useCallback, useMemo } from 'react';

import RoomFiles from './RoomFiles';
import { useDeleteFile } from './hooks/useDeleteFile';
import { useFilesList } from './hooks/useFilesList';
import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useRoom } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

const RoomFilesWithData = () => {
	const room = useRoom();
	const { closeTab } = useRoomToolbox();
	const [text, setText] = useState('');
	const [type, setType] = useLocalStorage('file-list-type', 'all');

	const handleTextChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setText(event.currentTarget.value);
	}, []);

	const query = useMemo(
		() => ({
			rid: room._id,
			type,
			text,
		}),
		[room._id, type, text],
	);

	const { filesList, loadMoreItems, reload } = useFilesList(query);
	const { phase, items: filesItems, itemCount: totalItemCount } = useRecordList(filesList);

	const handleDeleteFile = useDeleteFile(reload);

	return (
		<RoomFiles
			loading={phase === AsyncStatePhase.LOADING}
			type={type}
			text={text}
			filesItems={filesItems}
			loadMoreItems={loadMoreItems}
			setType={setType}
			setText={handleTextChange}
			total={totalItemCount}
			onClickClose={closeTab}
			onClickDelete={handleDeleteFile}
		/>
	);
};

export default RoomFilesWithData;
