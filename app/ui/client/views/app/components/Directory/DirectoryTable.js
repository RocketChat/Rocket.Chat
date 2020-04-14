import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Box, Icon, Pagination, Skeleton, Table, Flex, TextInput, Tile } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import { useDebounce } from '../hooks';
import { Markdown as mrkd } from '../../../../../../markdown/client';

function SortIcon({ direction }) {
	return <Box is='svg' width='x16' height='x16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
		<path d='M5.33337 5.99999L8.00004 3.33333L10.6667 5.99999' stroke={direction === 'desc' ? '#9EA2A8' : '#E4E7EA' } strokeWidth='1.33333' strokeLinecap='round' strokeLinejoin='round'/>
		<path d='M5.33337 10L8.00004 12.6667L10.6667 10' stroke={ direction === 'asc' ? '#9EA2A8' : '#E4E7EA'} strokeWidth='1.33333' strokeLinecap='round' strokeLinejoin='round'/>
	</Box>;
}

export function Th({ children, active, direction, sort, onClick, align, ...props }) {
	const fn = useMemo(() => () => onClick && onClick(sort), [sort, onClick]);
	return <Table.Cell clickable={!!sort} onClick={fn} { ...props }>
		<Box display='flex' alignItems='center' wrap='no-wrap'>{children}{sort && <SortIcon mod-active={active} direction={active && direction} />}</Box>
	</Table.Cell>;
}

export function Markdown({ children, ...props }) {
	return React.Children.map(children, function(text, index) {
		return <Box { ...props } key={index} dangerouslySetInnerHTML={{ __html: mrkd.parse(text) }}/>;
	});
}

const LoadingRow = ({ cols }) => <Table.Row>
	<Table.Cell>
		<Box display='flex'>
			<Flex.Item>
				<Skeleton variant='rect' height={40} width={40} />
			</Flex.Item>
			<Box mi='x8' flexGrow={1}>
				<Skeleton width='100%' />
				<Skeleton width='100%' />
			</Box>
		</Box>
	</Table.Cell>
	{ Array.from({ length: cols - 1 }, (_, i) => <Table.Cell key={i}>
		<Skeleton width='100%' />
	</Table.Cell>)}
</Table.Row>;

const style = { minHeight: '40px' };

export function DirectoryTable({
	data = {},
	renderRow,
	header,
	searchPlaceholder = 'placeholder',
	setParams = () => { },
}) {
	const t = useTranslation();

	const [text, setText] = useState('');

	const [itemsPerPage, setItemsPerPage] = useState(25);

	const [current, setCurrent] = useState(0);

	const term = useDebounce(text, 500);

	useEffect(() => {
		setParams({ term, current, itemsPerPage });
	}, [term, current, itemsPerPage]);

	const { result: channels, total } = data;


	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	const Loading = useCallback(() => Array.from({ length: 10 }, (_, i) => <LoadingRow cols={header.length} key={i}/>), [header && header.length]);

	const showingResultsLabel = useCallback(({ count, current, itemsPerPage }) => t('Showing results %s - %s of %s', current + 1, Math.min(current + itemsPerPage, count), count), []);

	const itemsPerPageLabel = useCallback(() => t('Items_per_page:'), []);

	return <>
		<Flex.Container direction='column'>
			<Box>
				<Box mb='x16' display='flex' flexDirection='column' style={style}>
					<TextInput placeholder={searchPlaceholder} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
				</Box>
				{channels && !channels.length
					? <Tile textStyle='p1' elevation='0' textColor='info' style={{ textAlign: 'center' }}>
						{t('No_data_found')}
					</Tile>
					: <>
						<Table fixed>
							{ header && <Table.Head>
								<Table.Row>
									{header}
								</Table.Row>
							</Table.Head> }
							<Table.Body>
								{channels
									? channels.map(renderRow)
									:	<Loading/>}
							</Table.Body>
						</Table>
						<Pagination
							current={current}
							itemsPerPage={itemsPerPage}
							itemsPerPageLabel={itemsPerPageLabel}
							showingResultsLabel={showingResultsLabel}
							count={total || 0}
							onSetItemsPerPage={setItemsPerPage}
							onSetCurrent={setCurrent}
						/>
					</>
				}
			</Box>
		</Flex.Container>
	</>;
}
