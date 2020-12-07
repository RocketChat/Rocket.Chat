import { Box, Pagination, Table, Tile } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import flattenChildren from 'react-keyed-flatten-children';

import { useTranslation } from '../../contexts/TranslationContext';
import HeaderCell from './HeaderCell';
import LoadingRow from './LoadingRow';
import ScrollableContentWrapper from '../ScrollableContentWrapper';

const GenericTable = ({
	children,
	fixed = true,
	header,
	params: paramsDefault = '',
	renderFilter,
	renderRow: RenderRow,
	results,
	setParams = () => { },
	total,
	...props
}, ref) => {
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
		{typeof renderFilter === 'function' ? renderFilter({ onChange: setFilter, ...props }) : null}
		{results && !results.length
			? <Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
				{t('No_data_found')}
			</Tile>
			: <>
				<Box mi='neg-x24' pi='x24' flexShrink={1} flexGrow={1} ref={ref} overflow='hidden'>
					<ScrollableContentWrapper>
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
					</ScrollableContentWrapper>
				</Box>
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
};

export default Object.assign(forwardRef(GenericTable), {
	HeaderCell,
});
