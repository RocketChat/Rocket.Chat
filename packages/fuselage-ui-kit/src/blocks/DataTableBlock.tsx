import { Box, IconButton, SearchInput, Table, TableBody, TableCell, TableHead, TableRow } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import RichTextBlock from './RichTextBlock';
import type { BlockProps } from '../utils/BlockProps';
import {
	cellText,
	isActionCell,
	isNumericColumn,
	isRawNumberCell,
	isRawTextCell,
	isRichTextCell,
	numberText,
	sortRows,
	toList,
} from '../utils/dataTable';

export type DataTableBlockProps = BlockProps<UiKit.DataTableBlock>;

const defaultPageSize = 5;
const maxPageSize = 100;
// The renderer bounds its work itself: validation only logs unless an administrator turns rejection on.
const maxColumns = 20;
const maxBodyRows = 200;

const integerIn = (value: unknown, min: number, max: number, fallback: number): number =>
	typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : fallback;

const ariaSort = { asc: 'ascending', desc: 'descending' } as const;
const sortIcon = { asc: 'arrow-up', desc: 'arrow-down' } as const;

type Sort = { column: number; direction: 'asc' | 'desc' };

const DataTableBlock = ({ className, block, context, surfaceRenderer }: DataTableBlockProps) => {
	const { t } = useTranslation();
	const [filter, setFilter] = useState('');
	const [sort, setSort] = useState<Sort>();
	const [requestedPage, setRequestedPage] = useState(0);

	const columns = useMemo(() => toList(toList(block.rows)[0]).slice(0, maxColumns), [block.rows]);
	// The original position identifies a row, so its state stays with it when the table is filtered or sorted.
	const rows = useMemo(
		() =>
			toList(block.rows)
				.slice(1, maxBodyRows + 1)
				.map((cells, index) => ({ cells: toList(cells), index })),
		[block.rows],
	);

	const pageSize = integerIn(block.page_size, 1, maxPageSize, defaultPageSize);
	const rowHeaderColumn = integerIn(block.row_header_column_index, 0, columns.length - 1, 0);

	const visibleRows = useMemo(() => {
		const query = filter.trim().toLowerCase();
		const matching = query
			? rows.filter(({ cells }) => cells.slice(0, columns.length).some((cell) => cellText(cell).toLowerCase().includes(query)))
			: rows;

		if (!sort) {
			return matching;
		}

		const numeric = isNumericColumn(
			rows.map(({ cells }) => cells),
			sort.column,
		);

		return sortRows(matching, sort.column, sort.direction, numeric, ({ cells }) => cells);
	}, [rows, columns.length, filter, sort]);

	const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
	const page = Math.min(requestedPage, pageCount - 1);
	const first = page * pageSize;
	const pageRows = visibleRows.slice(first, first + pageSize);

	const toggleSort = (column: number) => {
		setSort((current) => ({ column, direction: current?.column === column && current.direction === 'asc' ? 'desc' : 'asc' }));
		setRequestedPage(0);
	};

	const renderCell = (cell: unknown, key: number): ReactNode => {
		if (isRawTextCell(cell)) {
			return cell.text;
		}

		if (isRawNumberCell(cell)) {
			return numberText(cell);
		}

		if (isRichTextCell(cell)) {
			return <RichTextBlock block={cell} context={context} index={key} surfaceRenderer={surfaceRenderer} />;
		}

		if (isActionCell(cell)) {
			const { element } = cell;

			return surfaceRenderer.renderActionsBlockElement(
				{ ...element, appId: element.appId ?? block.appId, blockId: element.blockId ?? block.blockId },
				key,
			);
		}

		return null;
	};

	return (
		<Box className={className} display='flex' flexDirection='column' gap='x8'>
			<Box maxWidth='x320'>
				<SearchInput
					aria-label={t('Filter')}
					placeholder={t('Filter')}
					value={filter}
					onChange={(event) => {
						setFilter(event.currentTarget.value);
						setRequestedPage(0);
					}}
				/>
			</Box>
			<Box overflowX='auto'>
				<Table>
					<Box is='caption' fontScale='c1' color='annotation' textAlign='start'>
						{block.caption}
					</Box>
					<TableHead>
						<TableRow>
							{columns.map((cell, column) => {
								const direction = sort?.column === column ? sort.direction : undefined;

								return (
									<TableCell key={column} scope='col' aria-sort={direction && ariaSort[direction]}>
										<Box display='flex' alignItems='center' gap='x4'>
											{cellText(cell)}
											<IconButton
												size='mini'
												icon={direction ? sortIcon[direction] : 'sort'}
												title={t('UIKit_Data_table_sort', { column: cellText(cell) })}
												onClick={() => toggleSort(column)}
											/>
										</Box>
									</TableCell>
								);
							})}
						</TableRow>
					</TableHead>
					<TableBody>
						{pageRows.map(({ cells, index }) => (
							<TableRow key={index}>
								{columns.map((_, column) => (
									// Not `rowHeader`: its surface background stands out inside a message.
									<TableCell
										key={column}
										is={column === rowHeaderColumn ? 'th' : 'td'}
										scope={column === rowHeaderColumn ? 'row' : undefined}
									>
										{renderCell(cells[column], column)}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Box>
			<Box is='nav' aria-label={t('UIKit_Data_table_pagination')} display='flex' alignItems='center' justifyContent='end' gap='x8'>
				<Box fontScale='c1' color='annotation' aria-live='polite'>
					{t('Showing_results_of', {
						from: visibleRows.length ? first + 1 : 0,
						to: first + pageRows.length,
						total: visibleRows.length,
					})}
				</Box>
				{/* The chevron icons are drawn the other way round from their names, as the carousel buttons also account for. */}
				<IconButton
					size='small'
					icon='chevron-right'
					title={t('UIKit_Data_table_previous_page')}
					disabled={page === 0}
					onClick={() => setRequestedPage(page - 1)}
				/>
				<IconButton
					size='small'
					icon='chevron-left'
					title={t('UIKit_Data_table_next_page')}
					disabled={page >= pageCount - 1}
					onClick={() => setRequestedPage(page + 1)}
				/>
			</Box>
		</Box>
	);
};

export default memo(DataTableBlock);
