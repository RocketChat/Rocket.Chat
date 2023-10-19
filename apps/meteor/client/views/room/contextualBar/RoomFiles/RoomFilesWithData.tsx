import { useMutableCallback, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useUserId, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useCallback, useMemo } from 'react';

import GenericModal from '../../../../components/GenericModal';
import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useRoom } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';
import RoomFiles from './RoomFiles';
import { useFilesList } from './hooks/useFilesList';
import { useMessageDeletionIsAllowed } from './hooks/useMessageDeletionIsAllowed';

// TODO: replace method
const RoomFilesWithData = () => {
	const t = useTranslation();
	const room = useRoom();
	const uid = useUserId();

	const { closeTab } = useRoomToolbox();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const deleteFile = useMethod('deleteFileMessage');

	const [text, setText] = useState('');
	const [type, setType] = useLocalStorage('file-list-type', 'all');

	const handleTextChange = useCallback((event) => {
		setText(event.currentTarget.value);
	}, []);

	const isDeletionAllowed = useMessageDeletionIsAllowed(room._id, uid);

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

	const handleDelete = useMutableCallback((_id) => {
		const onConfirm = async () => {
			try {
				await deleteFile(_id);
				dispatchToastMessage({ type: 'success', message: t('Deleted') });
				reload();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(
			<GenericModal variant='danger' onConfirm={onConfirm} onCancel={() => setModal(null)} confirmText={t('Delete')}>
				{t('Delete_File_Warning')}
			</GenericModal>,
		);
	});

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
			onClickDelete={handleDelete}
			isDeletionAllowed={isDeletionAllowed}
		/>
	);
};

export default RoomFilesWithData;
