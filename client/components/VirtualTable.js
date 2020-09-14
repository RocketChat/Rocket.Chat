import React, { useMemo, useState, useEffect, useCallback, forwardRef } from 'react';
import { Box, Pagination, Skeleton, Table, Flex, Tile, Scrollable } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback, useResizeObserver } from '@rocket.chat/fuselage-hooks';
import flattenChildren from 'react-keyed-flatten-children';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';


import { useTranslation } from '../contexts/TranslationContext';
import { ENDPOINT_STATES } from '../hooks/useEndpointDataExperimental';

const LIST_SIZE = 25;
const ITEM_HEIGHT = 44;

const _rowRenderer = React.memo(function rowRenderer({ data, index, style, children: Item, ...props }) {
	if (!data[index]) {
		return <Skeleton style={style}/>;
	}

	return <Item data={data[index]} {...props}/>;
});

const VirtualTable = ({
	children,
	results,
	total,
	totalLoaded,
	loadMoreItems,
	rowRenderer,
	header,
	state,
	// resolveRef,
	// setParams = () => { },
	// loadMoreItems = () => { },
	// params: paramsDefault = '',
	// ...props
}) => {
	const t = useTranslation();

	// const [filter, setFilter] = useState(paramsDefault);

	// const [itemsPerPage, setItemsPerPage] = useState(25);

	// const [current, setCurrent] = useState(0);

	// const params = useDebouncedValue(filter, 500);

	const render = useMutableCallback((props) => {
		if (rowRenderer) {
			return rowRenderer({ children, ...props });
		}
		return _rowRenderer({ children, ...props });
	});

	// const loadMoreItems = useMutableCallback((startIndex, stopIndex) => {
	// 	setParams({ offset: startIndex, count: startIndex - stopIndex });

	// 	return new Promise((resolve) => { resolveRef.current = resolve; });
	// });

	const isItemLoaded = useMutableCallback((index) => index > totalLoaded);

	const loading = state === ENDPOINT_STATES.LOADING;

	// useEffect(() => {
	// 	setParams({ ...params, current, itemsPerPage });
	// }, [params, current, itemsPerPage, setParams]);

	// const Loading = useCallback(() => {
	// 	const headerCells = flattenChildren(header);
	// 	return Array.from({ length: 10 }, (_, i) => <LoadingRow key={i} cols={headerCells.length} />);
	// }, [header]);

	// const showingResultsLabel = useCallback(({ count, current, itemsPerPage }) => t('Showing results %s - %s of %s', current + 1, Math.min(current + itemsPerPage, count), count), [t]);

	const { ref, contentBoxSize: { inlineSize = 1200, blockSize = 750 } = {} } = useResizeObserver({ debounceDelay: 100 });

	return <>
		{results && !results.length
			? <Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
				{t('No_data_found')}
			</Tile>
			: <>
				<Scrollable>
					<Box mi='neg-x24' pi='x24' flexGrow={1} ref={ref}>
						<Table fixed sticky>
							{header && <Table.Head>
								<Table.Row>
									{header}
								</Table.Row>
							</Table.Head>}
							<Table.Body>
								<InfiniteLoader
									isItemLoaded={isItemLoaded}
									itemCount={total}
									loadMoreItems={ loading ? () => {} : loadMoreItems}
								>
									{({ onItemsRendered, ref }) => (<List
										height={blockSize}
										width={inlineSize}
										itemCount={total}
										itemData={results}
										itemSize={ITEM_HEIGHT}
										ref={ref}
										minimumBatchSize={LIST_SIZE}
										onItemsRendered={onItemsRendered}
									>{render}</List>
									)}
								</InfiniteLoader>
								{/* {children && (results ? results.map(children) : <Loading />)} */}
							</Table.Body>
						</Table>
					</Box>
				</Scrollable>
				{/* <Pagination
					divider
					current={current}
					itemsPerPage={itemsPerPage}
					itemsPerPageLabel={itemsPerPageLabel}
					showingResultsLabel={showingResultsLabel}
					count={total || 0}
					onSetItemsPerPage={setItemsPerPage}
					onSetCurrent={setCurrent}
				/> */}
			</>
		}
	</>;
};

export default VirtualTable;
