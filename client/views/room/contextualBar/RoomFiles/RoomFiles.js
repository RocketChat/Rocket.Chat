import React, { useState, useCallback, useMemo } from 'react';
import { useMutableCallback, useLocalStorage, useUniqueId, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import {
	Box,
	Icon,
	TextInput,
	Select,
	Throbber,
	Margins,
} from '@rocket.chat/fuselage';
import { Virtuoso } from 'react-virtuoso';
import memoize from 'memoize-one';

import { useUserId } from '../../../../contexts/UserContext';
import DeleteFileWarning from '../../../../components/DeleteFileWarning';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useSetModal } from '../../../../contexts/ModalContext';
import { useMethod } from '../../../../contexts/ServerContext';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useTranslation } from '../../../../contexts/TranslationContext';
import VerticalBar from '../../../../components/VerticalBar';
import FileItem from './components/FileItem';
import { useFilesList } from './hooks/useFilesList';
import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { useMessageDeletionIsAllowed } from './hooks/useMessageDeletionIsAllowed';
import { useTabBarClose } from '../../providers/ToolboxProvider';
import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';

const Row = React.memo(({ item, data, index }) => {
	const { userId, onClickDelete, isDeletionAllowed } = data;

	return item && <RoomFiles.Item
		index={index}
		_id={item._id}
		name={item.name}
		url={item.url}
		uploadedAt={item.uploadedAt}
		user={item.user}
		ts={item.ts}
		type={item.type}
		typeGroup={item.typeGroup}
		fileData={item}
		userId={userId}
		onClickDelete={onClickDelete}
		isDeletionAllowed={isDeletionAllowed}
	/>;
});

export const createItemData = memoize((onClickDelete, isDeletionAllowed) => ({
	onClickDelete,
	isDeletionAllowed,
}));


export const RoomFiles = function RoomFiles({
	loading,
	filesItems = [],
	text,
	type,
	setText,
	setType,
	onClickClose,
	onClickDelete,
	total,
	loadMoreItems,
	isDeletionAllowed,
}) {
	const t = useTranslation();
	const options = useMemo(() => [
		['all', t('All')],
		['image', t('Images')],
		['video', t('Videos')],
		['audio', t('Audios')],
		['text', t('Texts')],
		['application', t('Files')],
	], [t]);
	const inputRef = useAutoFocus(true);

	const searchId = useUniqueId();

	const itemData = createItemData(onClickDelete, isDeletionAllowed);

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='attachment'/>
				<VerticalBar.Text>{t('Files')}</VerticalBar.Text>
				{ onClickClose && <VerticalBar.Close onClick={onClickClose} /> }
			</VerticalBar.Header>

			<VerticalBar.Content p='x12'>
				<Box display='flex' flexDirection='row' p='x12' flexShrink={0}>
					<Box display='flex' flexDirection='row' flexGrow={1} mi='neg-x4'>
						<Margins inline='x4'>
							<TextInput data-qa-files-search id={searchId} placeholder={t('Search_Files')} ref={inputRef} value={text} onChange={setText} addon={<Icon name='magnifier' size='x20'/>}/>
							<Select
								flexGrow={0}
								width='110px'
								onChange={setType}
								value={type}
								options={options} />
						</Margins>
					</Box>
				</Box>

				{loading && <Box p='x12'><Throbber size='x12' /></Box>}
				{!loading && filesItems.length <= 0 && <Box p='x12'>{t('No_results_found')}</Box>}

				<Box w='full' h='full' flexShrink={1} overflow='hidden'>
					<Virtuoso
						style={{ height: '100%', width: '100%' }}
						totalCount={total}
						endReached={ loading ? () => {} : (start) => loadMoreItems(start, Math.min(50, total - start))}
						overscan={50}
						data={filesItems}
						components={{ Scroller: ScrollableContentWrapper }}
						itemContent={(index, data) => <Row
							data={itemData}
							index={index}
							item={data}
						/>}
					/>
				</Box>
			</VerticalBar.Content>
		</>
	);
};

RoomFiles.Item = FileItem;

export default ({ rid }) => {
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

	const { filesList, loadMoreItems } = useFilesList(useMemo(() => ({ rid, type, text }), [rid, type, text]));
	const { phase, items: filesItems, itemCount: totalItemCount } = useRecordList(filesList);

	const handleDelete = useMutableCallback((_id) => {
		const onConfirm = async () => {
			try {
				await deleteFile(_id);
				dispatchToastMessage({ type: 'success', message: t('Deleted') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			closeModal();
		};

		setModal(<DeleteFileWarning onConfirm={onConfirm} onCancel={closeModal} />);
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
