import { useMutableCallback, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useUserId, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useCallback, useMemo } from 'react';

import GenericModal from '../../../../components/GenericModal';
import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useTabBarClose } from '../../providers/ToolboxProvider';
import RoomFiles from './RoomFiles';
import { useFilesList } from './hooks/useFilesList';
import { useMessageDeletionIsAllowed } from './hooks/useMessageDeletionIsAllowed';

const RoomFilesWithData = ({ rid }) => {
	const uid = useUserId();
	const onClickClose = useTabBarClose();
	const t = useTranslation();
	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal());
	const dispatchToastMessage = useToastMessageDispatch();
	const deleteFile = useMethod('deleteFileMessage');

	const [type, setType] = useLocalStorage('file-list-type', 'all');
	const [text, setText] = useState('');

	const handleTextChange = useCallback((event) => {
		setText(event.currentTarget.value);
	}, []);

	const { filesList, loadMoreItems, reload } = useFilesList(useMemo(() => ({ rid, type, text }), [rid, type, text]));
	const { phase, items: filesItems, itemCount: totalItemCount } = useRecordList(filesList);

	const handleDelete = useMutableCallback((_id) => {
		const onConfirm = async () => {
			try {
				await deleteFile(_id);
				dispatchToastMessage({ type: 'success', message: t('Deleted') });
				reload();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			closeModal();
		};

		setModal(
			<GenericModal variant='danger' onConfirm={onConfirm} onCancel={closeModal} confirmText={t('Delete')}>
				{t('Delete_File_Warning')}
			</GenericModal>,
		);
	}, []);

	const isDeletionAllowed = useMessageDeletionIsAllowed(rid, uid);

	return (
		<RoomFiles
			rid={rid}
			loading={phase === AsyncStatePhase.LOADING}
			type={type}
			text={text}
			loadMoreItems={loadMoreItems}
			setType={setType}
			setText={handleTextChange}
			filesItems={filesItems}
			total={totalItemCount}
			onClickClose={onClickClose}
			onClickDelete={handleDelete}
			isDeletionAllowed={isDeletionAllowed}
		/>
	);
};

export default RoomFilesWithData;
