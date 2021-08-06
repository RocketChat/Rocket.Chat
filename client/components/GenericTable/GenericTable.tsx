import { Box, Pagination, Table, Tile } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, {
	useState,
	useEffect,
	useCallback,
	forwardRef,
	ReactNode,
	ReactElement,
	Key,
	RefAttributes,
} from 'react';
import flattenChildren from 'react-keyed-flatten-children';

import { useTranslation } from '../../contexts/TranslationContext';
import ScrollableContentWrapper from '../ScrollableContentWrapper';
import LoadingRow from './LoadingRow';

const defaultParamsValue = { text: '', current: 0, itemsPerPage: 25 } as const;
const defaultSetParamsValue = (): void => undefined;

type Params = { text?: string; current?: number; itemsPerPage?: 25 | 50 | 100 };

type GenericTableProps<
	FilterProps extends { onChange?: (params: Params) => void },
	ResultProps extends { _id?: Key },
> = {
	fixed?: boolean;
	header?: ReactNode;
	params?: Params;
	setParams?: (params: Params) => void;
	children?: (props: ResultProps, key: number) => ReactElement;
	renderFilter?: (props: FilterProps) => ReactElement;
	renderRow?: (props: ResultProps) => ReactElement;
	results?: ResultProps[];
	total?: number;
	pagination?: boolean;
} & FilterProps;

const GenericTable: {
	<FilterProps extends { onChange?: (params: Params) => void }, ResultProps extends { _id?: Key }>(
		props: GenericTableProps<FilterProps, ResultProps> & RefAttributes<HTMLElement>,
	): ReactElement | null;
} = forwardRef(function GenericTable(
	{
		children,
		fixed = true,
		header,
		params: paramsDefault = defaultParamsValue,
		setParams = defaultSetParamsValue,
		renderFilter,
		renderRow: RenderRow,
		results,
		total,
		pagination = true,
		...props
	},
	ref,
) {
	const t = useTranslation();

	const [filter, setFilter] = useState(paramsDefault);

	const [itemsPerPage, setItemsPerPage] = useState<25 | 50 | 100>(25);

	const [current, setCurrent] = useState(0);

	const params = useDebouncedValue(filter, 500);

	useEffect(() => {
		setParams({ ...params, current, itemsPerPage });
	}, [params, current, itemsPerPage, setParams]);

	const Loading = useCallback(() => {
		const headerCells = flattenChildren(header);
		return (
			<>
				{Array.from({ length: 10 }, (_, i) => (
					<LoadingRow key={i} cols={headerCells.length} />
				))}
			</>
		);
	}, [header]);

	const showingResultsLabel = useCallback(
		({ count, current, itemsPerPage }) =>
			t('Showing_results_of', current + 1, Math.min(current + itemsPerPage, count), count),
		[t],
	);

	const itemsPerPageLabel = useCallback(() => t('Items_per_page:'), [t]);

	return (
		<>
			{typeof renderFilter === 'function'
				? renderFilter({ ...props, onChange: setFilter } as any) // TODO: ugh
				: null}
			{results && !results.length ? (
				<Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
					{t('No_data_found')}
				</Tile>
			) : (
				<>
					<Box mi='neg-x24' pi='x24' flexShrink={1} flexGrow={1} ref={ref} overflow='hidden'>
						<ScrollableContentWrapper overflowX>
							<Table fixed={fixed} sticky>
								{header && (
									<Table.Head>
										<Table.Row>{header}</Table.Row>
									</Table.Head>
								)}
								<Table.Body>
									{RenderRow &&
										(results ? (
											results.map((props, index) => (
												<RenderRow key={props._id || index} {...props} />
											))
										) : (
											<Loading />
										))}
									{children && (results ? results.map(children) : <Loading />)}
								</Table.Body>
							</Table>
						</ScrollableContentWrapper>
					</Box>
					{pagination && (
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
					)}
				</>
			)}
		</>
	);
});

export default GenericTable;
