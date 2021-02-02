import React, { useState, useCallback, useMemo } from 'react';
import { useMutableCallback, useLocalStorage, useDebouncedState, useUniqueId } from '@rocket.chat/fuselage-hooks';
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

import { useUserId, useUserRoom } from '../../../../contexts/UserContext';
import DeleteFileWarning from '../../../../components/DeleteFileWarning';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useSetModal } from '../../../../contexts/ModalContext';
import { useMethod } from '../../../../contexts/ServerContext';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useTranslation } from '../../../../contexts/TranslationContext';
import VerticalBar from '../../../../components/VerticalBar';
import FileItem from './components/FileItem';
import { useFileList } from './hooks/useFileList';
import { useComponentDidUpdate } from '../../../../hooks/useComponentDidUpdate';
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

	const searchId = useUniqueId();

	const itemData = createItemData(onClickDelete, isDeletionAllowed);

	const lm = useMutableCallback((start) => loadMoreItems(start + 1, Math.min(50, start + 1 - filesItems.length)));

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
							<TextInput data-qa-files-search id={searchId} placeholder={t('Search_Files')} value={text} onChange={setText} addon={<Icon name='magnifier' size='x20'/>}/>
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
						endReached={loading ? () => {} : lm}
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
	const room = useUserRoom(rid);
	room.type = room.t;
	room.rid = rid;

	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal());
	const dispatchToastMessage = useToastMessageDispatch();
	const deleteFile = useMethod('deleteFileMessage');

	const [type, setType] = useLocalStorage('file-list-type', 'all');
	const [text, setText] = useState('');

	const [query, setQuery] = useDebouncedState({
		roomId: rid,
		sort: JSON.stringify({ uploadedAt: -1 }),
		count: 50,
		query: JSON.stringify({
			...type !== 'all' && {
				typeGroup: type,
			},
		}),
	}, 500);

	const handleTextChange = useCallback((event) => {
		setText(event.currentTarget.value);
	}, []);

	useComponentDidUpdate(() => setQuery((params) => ({
		...params,
		roomId: rid,
		query: JSON.stringify({
			name: { $regex: text || '', $options: 'i' },
			...type !== 'all' && {
				typeGroup: type,
			},
		}),
	})), [rid, text, type, setQuery]);

	const { value: data, phase: state, reload, more } = useFileList(room.type, query);

	const handleDelete = useMutableCallback((_id) => {
		const onConfirm = async () => {
			try {
				await deleteFile(_id);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			closeModal();
			reload();
		};

		setModal(<DeleteFileWarning onConfirm={onConfirm} onCancel={closeModal} />);
	}, []);

	const loadMoreItems = useCallback(
		(start, end) => {
			more(
				(params) => ({ ...params, offset: start, count: end - start }),
				(prev, next) => ({
					total: next.total,
					files: [...prev.files, ...next.files],
				}),
			);
		},
		[more],
	);

	const isDeletionAllowed = useMessageDeletionIsAllowed(rid, uid);

	return (
		<RoomFiles
			rid={rid}
			loading={state === AsyncStatePhase.LOADING && true}
			type={type}
			text={text}
			loadMoreItems={loadMoreItems}
			setType={setType}
			setText={handleTextChange}
			filesItems={[AsyncStatePhase.UPDATING, AsyncStatePhase.RESOLVED].includes(state) && data?.files}
			total={data?.total}
			onClickClose={onClickClose}
			onClickDelete={handleDelete}
			isDeletionAllowed={isDeletionAllowed}
		/>
	);
};
