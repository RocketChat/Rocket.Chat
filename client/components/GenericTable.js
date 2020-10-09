import { Box, Pagination, Skeleton, Table, Flex, Tile, Scrollable } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useState, useEffect, useCallback, forwardRef } from 'react';
import flattenChildren from 'react-keyed-flatten-children';

import { useTranslation } from '../contexts/TranslationContext';

function SortIcon({ direction }) {
	return <Box is='svg' width='x16' height='x16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
		<path d='M5.33337 5.99999L8.00004 3.33333L10.6667 5.99999' stroke={direction === 'desc' ? '#9EA2A8' : '#E4E7EA' } strokeWidth='1.33333' strokeLinecap='round' strokeLinejoin='round'/>
		<path d='M5.33337 10L8.00004 12.6667L10.6667 10' stroke={ direction === 'asc' ? '#9EA2A8' : '#E4E7EA'} strokeWidth='1.33333' strokeLinecap='round' strokeLinejoin='round'/>
	</Box>;
}

export function Th({ children, active, direction, sort, onClick, align, ...props }) {
	const fn = useMemo(() => () => onClick && onClick(sort), [sort, onClick]);
	return <Table.Cell clickable={!!sort} onClick={fn} { ...props }>
		<Box display='flex' alignItems='center' wrap='no-wrap'>{children}{sort && <SortIcon direction={active && direction} />}</Box>
	</Table.Cell>;
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

export const GenericTable = forwardRef(function GenericTable({
	children,
	results,
	fixed = true,
	total,
	renderRow: RenderRow,
	header,
	setParams = () => { },
	params: paramsDefault = '',
	FilterComponent = () => null,
	...props
}, ref) {
	const t = useTranslation();

	const [filter, setFilter] = useState(paramsDefault);

	const [itemsPerPage, setItemsPerPage] = useState(25);

	const [current, setCurrent] = useState(0);

	const params = useDebouncedValue(filter, 500);

	useEffect(() => {
		setParams({ ...params, current, itemsPerPage });
	}, [params, current, itemsPerPage, setParams]);

	const Loading = useCallback(() => {
		const headerCells = flattenChildren(header);
		return Array.from({ length: 10 }, (_, i) => <LoadingRow key={i} cols={headerCells.length} />);
	}, [header]);

	const showingResultsLabel = useCallback(({ count, current, itemsPerPage }) => t('Showing results %s - %s of %s', current + 1, Math.min(current + itemsPerPage, count), count), [t]);

	const itemsPerPageLabel = useCallback(() => t('Items_per_page:'), [t]);

	return <>
		<FilterComponent setFilter={setFilter} { ...props}/>
		{results && !results.length
			? <Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
				{t('No_data_found')}
			</Tile>
			: <>
				<Scrollable>
					<Box mi='neg-x24' pi='x24' flexGrow={1} ref={ref}>
						<Table fixed={fixed} sticky>
							{header && <Table.Head>
								<Table.Row>
									{header}
								</Table.Row>
							</Table.Head>}
							<Table.Body>
								{RenderRow && (
									results
										? results.map((props, index) => <RenderRow key={props._id || index} { ...props }/>)
										: <Loading/>
								)}
								{children && (results ? results.map(children) : <Loading />)}
							</Table.Body>
						</Table>
					</Box>
				</Scrollable>
				<Pagination
					divider
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
	</>;
});

export default Object.assign(GenericTable, {
	HeaderCell: Th,
});
