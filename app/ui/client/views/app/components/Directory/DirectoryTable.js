import React, { useMemo, useState, useEffect } from 'react';
import { Box, Icon, Margins, Pagination, Skeleton, Table, Flex, Avatar, TextInput, Tile } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import { useDebounce } from '../hooks';

function SortIcon({ direction }) {
	return <Box is='svg' width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
		<path d='M5.33337 5.99999L8.00004 3.33333L10.6667 5.99999' stroke={direction === 'desc' ? '#9EA2A8' : '#E4E7EA' } strokeWidth='1.33333' strokeLinecap='round' strokeLinejoin='round'/>
		<path d='M5.33337 10L8.00004 12.6667L10.6667 10' stroke={ direction === 'asc' ? '#9EA2A8' : '#E4E7EA'} strokeWidth='1.33333' strokeLinecap='round' strokeLinejoin='round'/>
	</Box>;
}

export function Th({ children, active, direction, sort, onClick, ...props }) {
	const fn = useMemo(() => () => onClick && onClick(sort), [sort, onClick]);
	return <Table.Cell style={ { width: '100%' } } clickable={!!sort} onClick={fn} { ...props }>
		<Flex.Container alignItems='center' wrap='no-wrap'>
			<Box>{children}{sort && <SortIcon mod-active={active} direction={active && direction} />}</Box>
		</Flex.Container>
	</Table.Cell>;
}

const LoadingRow = ({ cols }) => <Table.Row>
	<Table.Cell>
		<Flex.Container>
			<Box>
				<Flex.Item>
					<Box>
						<Skeleton variant='rect' height={40} width={40} />
					</Box>
				</Flex.Item>
				<Margins inline='x8'>
					<Flex.Item grow={1}>
						<Box>
							<Skeleton width='100%' />
							<Skeleton width='100%' />
						</Box>
					</Flex.Item>
				</Margins>
			</Box>
		</Flex.Container>
	</Table.Cell>
	{ Array.from({ length: cols - 1 }, (_, i) => <Table.Cell key={i}>
		<Skeleton width='100%' />
	</Table.Cell>)}
</Table.Row>;

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


	const handleChange = useMemo(() => (event) => setText(event.currentTarget.value), []);

	const Loading = useMemo(() => () => Array.from({ length: 10 }, (_, i) => <LoadingRow cols={header.length} kye={i}/>), [header && header.length]);

	const showingResultsLabel = useMemo(() => ({ count, current, itemsPerPage }) => t('Showing results %s - %s of %s', current + 1, Math.min(current + itemsPerPage, count), count), []);

	return <>
		<Flex.Container direction='column'>
			<Box>
				<Margins block='x16'>
					<TextInput placeholder={searchPlaceholder} addon={<Icon name='magnifier' size='20'/>} onChange={handleChange} value={text} />
				</Margins>
				{channels && !channels.length
					? <Tile textStyle='p1' elevation='0' textColor='info' style={{ textAlign: 'center' }}>
						{t('No_data_found')}
					</Tile>
					: <Avatar.Context.Provider value={{ baseUrl: '/avatar/' }}>
						<Table>
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
							itemsPerPageLabel={() => t('Items_per_page:')}
							showingResultsLabel={showingResultsLabel}
							count={total || 0}
							onSetItemsPerPage={setItemsPerPage}
							onSetCurrent={setCurrent}
						/>
					</Avatar.Context.Provider>}
			</Box>
		</Flex.Container>
	</>;
}
