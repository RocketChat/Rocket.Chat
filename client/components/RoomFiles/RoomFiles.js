import React, { useCallback, useState, useMemo } from 'react';
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
import { useDebouncedValue, useResizeObserver, useLocalStorage } from '@rocket.chat/fuselage-hooks';

import FileItem from './FileItem';
import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from '../basic/VerticalBar';

const LOADING = 1;
const LOADED = 2;
let itemStatusMap = {};

export const RoomFiles = function RoomFiles({
	loading,
	filesItems = [],
	onClickClose,
}) {
	const t = useTranslation();

	const isItemLoaded = index => !!itemStatusMap[index];

	const loadMoreItems = (startIndex, stopIndex) => {
		for (let index = startIndex; index <= stopIndex; index++) {
			itemStatusMap[index] = LOADING;
		}
		return new Promise(resolve =>
			setTimeout(() => {
				for (let index = startIndex; index <= stopIndex; index++) {
					itemStatusMap[index] = LOADED;
				}
				resolve();
			}, 2500),
		);
	};

	const fileRenderer = useCallback(({ data, index, style }) => <RoomFiles.Item
		{...filesItems[index]}
		data={data}
		index={index}
		style={style}
	/>, [filesItems]);

	const [type, setType] = useLocalStorage('thread-list-type', 'all');
	const [text, setText] = useState('');

	const options = useMemo(() => [
		['all', t('All')],
		['images', t('Images')],
		['videos', t('Videos')],
		['audios', t('Audios')],
		['texts', t('Texts')],
		['files', t('Files')],
	], [t]);

	const handleTextChange = useCallback((event) => {
		setText(event.currentTarget.value);
	}, []);

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='attachment'/>
				<VerticalBar.Text>{t('Files')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClickClose} />
			</VerticalBar.Header>

			<Box width='full' p='x24' pbe='x0' mi='neg-x4'>
				<FieldGroup>
					<Box flexDirection='row' alignItems='flex-end' display='flex' justifyContent='stretch'>
						<Box flexGrow={2} flexBasis='75%' mi='x4'>
							<Field>
								<Field.Label htmlFor='test' flexGrow={0}>{t('Search_by_file_name')}</Field.Label>
								<Field.Row>
									<TextInput placeholder={t('Search_Messages')} value={text} onChange={handleTextChange} addon={<Icon name='magnifier' size='x20'/>}/>
								</Field.Row>
							</Field>
						</Box>

						<Box flexGrow={1} flexBasis='25%' mi='x4'>
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

			<VerticalBar.ScrollableContent p='x12'>
				{loading && <Box p='x12'><Throbber size='x12' /></Box>}

				<Margins all='none'>
					<InfiniteLoader
						isItemLoaded={isItemLoaded}
						itemCount={filesItems.length}
						loadMoreItems={loadMoreItems}
					>
						{({ onItemsRendered, ref }) => (
							<List
								className='List'
								height={500}
								itemCount={filesItems.length}
								itemSize={30}
								onItemsRendered={onItemsRendered}
								ref={ref}
							>
								{fileRenderer}
							</List>
						)}
					</InfiniteLoader>
				</Margins>
			</VerticalBar.ScrollableContent>
		</>
	);
};

RoomFiles.Item = FileItem;

export default React.memo(RoomFiles);
