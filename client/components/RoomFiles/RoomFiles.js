import React, { useCallback, useMemo } from 'react';
import {
	Box,
	Icon,
	TextInput,
	Field,
	FieldGroup,
	Select,
	Throbber,
	Margins,
} from '@rocket.chat/fuselage';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { useResizeObserver, useUniqueId } from '@rocket.chat/fuselage-hooks';

import FileItem from './FileItem';
import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from '../basic/VerticalBar';

const LOADING = 1;
const LOADED = 2;
const itemStatusMap = {};

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
}) {
	const t = useTranslation();
	const isItemLoaded = (index) => !!itemStatusMap[index];

	const loadMoreItems = (offset, count, startIndex, stopIndex) => {
		for (let index = startIndex; index <= stopIndex; index++) {
			itemStatusMap[index] = LOADING;
		}
		return new Promise((resolve) =>
			setTimeout(() => {
				for (let index = startIndex; index <= stopIndex; index++) {
					itemStatusMap[index] = LOADED;
				}
				resolve();
			}, 2500),
		);
	};

	const fileRenderer = useCallback(({ data, index, style }) => <RoomFiles.Item
		data={data}
		index={index}
		style={style}
		fileData={filesItems[index]}
		userId={userId}
		onClickDelete={onClickDelete}
	/>, [filesItems, userId, onClickDelete]);

	const options = useMemo(() => [
		['all', t('All')],
		['image', t('Images')],
		['video', t('Videos')],
		['audio', t('Audios')],
		['text', t('Texts')],
		['application', t('Files')],
	], [t]);

	const { ref, contentBoxSize: { blockSize = 200 } = {} } = useResizeObserver({ debounceDelay: 100 });

	const searchId = useUniqueId();

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='attachment'/>
				<VerticalBar.Text>{t('Files')}</VerticalBar.Text>
				{ onClickClose && <VerticalBar.Close onClick={onClickClose} /> }
			</VerticalBar.Header>

			<VerticalBar.Content p='x12'>
				<Box width='full' pi='x12' pb='x12' mi='neg-x4'>
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

				<Box w='full' h='full' ref={ref}>
					<Margins all='none'>
						<InfiniteLoader
							isItemLoaded={isItemLoaded}
							itemCount={filesItems.length}
							loadMoreItems={loadMoreItems}
						>
							{({ onItemsRendered, ref }) => (
								<List
									className='List'
									height={blockSize}
									itemCount={filesItems.length}
									itemSize={74}
									onItemsRendered={onItemsRendered}
									ref={ref}
								>
									{fileRenderer}
								</List>
							)}
						</InfiniteLoader>
					</Margins>
				</Box>
			</VerticalBar.Content>
		</>
	);
};

RoomFiles.Item = FileItem;

export default React.memo(RoomFiles);
