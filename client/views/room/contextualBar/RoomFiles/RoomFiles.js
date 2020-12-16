import React, { useState, useCallback, useMemo } from 'react';
import { useMutableCallback, useLocalStorage, useDebouncedState, useUniqueId, useResizeObserver } from '@rocket.chat/fuselage-hooks';
import {
	Box,
	Icon,
	TextInput,
	Field,
	FieldGroup,
	Select,
	Throbber,
} from '@rocket.chat/fuselage';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
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
import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import { useFileList } from './hooks';
import { useComponentDidUpdate } from '../../../../hooks/useComponentDidUpdate';


const Row = React.memo(({ data, index, style }) => {
	const { items, userId, onClickDelete } = data;
	const item = items[index] || null;
	return item && <RoomFiles.Item
		index={index}
		style={style}
		_id={item._id}
		name={item.name}
		url={item.url}
		uploadedAt={item.uploadedAt}
		user={item.user}
		type={item.type}
		typeGroup={item.typeGroup}
		fileData={data[index]}
		userId={userId}
		onClickDelete={onClickDelete}
	/>;
});

export const createItemData = memoize((items, onClickDelete, userId) => ({
	items,
	onClickDelete,
	userId,
}));


export const RoomFiles = function RoomFiles({
	userId,
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
}) {
	const t = useTranslation();
	const isItemLoaded = (index) => !!filesItems[index];
	const options = useMemo(() => [
		['all', t('All')],
		['image', t('Images')],
		['video', t('Videos')],
		['audio', t('Audios')],
		['text', t('Texts')],
		['application', t('Files')],
	], [t]);

	const { ref, contentBoxSize: { blockSize = 780 } = {} } = useResizeObserver({ debounceDelay: 100 });

	const searchId = useUniqueId();

	const itemData = createItemData(filesItems, onClickDelete, userId);

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='attachment'/>
				<VerticalBar.Text>{t('Files')}</VerticalBar.Text>
				{ onClickClose && <VerticalBar.Close onClick={onClickClose} /> }
			</VerticalBar.Header>

			<VerticalBar.Content p='x12'>
				<Box width='full' p='x12' mi='neg-x4'>
					<FieldGroup>
						<Box flexDirection='row' alignItems='flex-end' display='flex' justifyContent='stretch'>
							<Box flexGrow={2} flexBasis='80%' mi='x4'>
								<Field>
									<Field.Label htmlFor={searchId} flexGrow={0}>{t('Search_by_file_name')}</Field.Label>
									<Field.Row>
										<TextInput data-qa-files-search id={searchId} placeholder={t('Search_Files')} value={text} onChange={setText} addon={<Icon name='magnifier' size='x20'/>}/>
									</Field.Row>
								</Field>
							</Box>

							<Box flexGrow={1} flexBasis='20%' mi='x4'>
								<Field>
									<Field.Row>
										<Select
											onChange={setType}
											value={type}
											options={options} />
									</Field.Row>
								</Field>
							</Box>
						</Box>
					</FieldGroup>
				</Box>

				{loading && <Box p='x12'><Throbber size='x12' /></Box>}
				{!loading && filesItems.length <= 0 && <Box p='x12'>{t('No_results_found')}</Box>}

				<Box w='full' h='full' ref={ref} flexShrink={1} overflow='hidden'>
					<InfiniteLoader
						isItemLoaded={isItemLoaded}
						itemCount={total}
						loadMoreItems={loadMoreItems}
					>
						{({ onItemsRendered, ref }) => (
							<List
								outerElementType={ScrollableContentWrapper}
								className='List'
								height={blockSize}
								itemCount={total}
								itemSize={74}
								itemData={itemData}
								onItemsRendered={onItemsRendered}
								ref={ref}
							>
								{Row}
							</List>
						)}
					</InfiniteLoader>
				</Box>
			</VerticalBar.Content>
		</>
	);
};

RoomFiles.Item = FileItem;

export default ({ rid, tabBar }) => {
	const onClickClose = useMutableCallback(() => tabBar && tabBar.close());
	const userId = useUserId();
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

	const loadMoreItems = useCallback((start, end) => more((params) => ({ ...params, offset: start, count: end - start }), (prev, next) => ({
		total: next.total,
		files: [...prev.files, ...next.files],
	})), [more]);

	return (
		<RoomFiles
			userId={userId}
			loading={state === AsyncStatePhase.LOADING && true}
			type={type}
			text={text}
			loadMoreItems={loadMoreItems}
			setType={setType}
			setText={handleTextChange}
			filesItems={state === AsyncStatePhase.RESOLVED && data?.files}
			total={data?.total}
			onClickClose={onClickClose}
			onClickDelete={handleDelete}
		/>
	);
};
