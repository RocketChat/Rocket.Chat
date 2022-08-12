import { Pagination, Tile } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useEffect, forwardRef, ReactNode, ReactElement, Key, useMemo, Ref } from 'react';
import flattenChildren from 'react-keyed-flatten-children';

import { GenericTable as GenericTableV2 } from './V2/GenericTable';
import { GenericTableBody } from './V2/GenericTableBody';
import { GenericTableHeader } from './V2/GenericTableHeader';
import { GenericTableLoadingTable } from './V2/GenericTableLoadingTable';
import { usePagination } from './hooks/usePagination';

const defaultParamsValue = { text: '', current: 0, itemsPerPage: 25 } as const;
const defaultSetParamsValue = (): void => undefined;

export type GenericTableParams = {
	text?: string;
	current: number;
	itemsPerPage: 25 | 50 | 100;
};

type GenericTableProps<FilterProps extends { onChange?: (params: GenericTableParams) => void }, ResultProps> = {
	fixed?: boolean;
	header?: ReactNode;
	params?: GenericTableParams;
	setParams?: (params: GenericTableParams) => void;
	children?: (props: ResultProps, key: number) => ReactElement;
	renderFilter?: (props: FilterProps) => ReactElement;
	renderRow?: (props: ResultProps) => ReactElement;
	results?: ResultProps[];
	total?: number;
	pagination?: boolean;
} & FilterProps;

const GenericTable = forwardRef(function GenericTable<
	FilterProps extends { onChange?: (params: GenericTableParams) => void },
	ResultProps extends { _id?: Key } | object,
>(
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
	}: GenericTableProps<FilterProps, ResultProps>,
	ref: Ref<HTMLElement>,
) {
	const t = useTranslation();

	const [filter, setFilter] = useState(paramsDefault);

	const { itemsPerPage, setItemsPerPage, current, setCurrent, itemsPerPageLabel, showingResultsLabel } = usePagination();

	const params = useDebouncedValue(filter, 500);

	useEffect(() => {
		setParams({ ...params, text: params.text || '', current, itemsPerPage });
	}, [params, current, itemsPerPage, setParams]);

	const headerCells = useMemo(() => flattenChildren(header).length, [header]);

	const isLoading = !results;

	return (
		<>
			{typeof renderFilter === 'function'
				? renderFilter({ ...props, onChange: setFilter } as any) // TODO: ugh
				: null}
			{results && !results.length ? (
				<Tile fontScale='p2' elevation='0' color='info' textAlign='center'>
					{t('No_data_found')}
				</Tile>
			) : (
				<>
					<GenericTableV2 fixed={fixed} ref={ref}>
						{header && <GenericTableHeader>{header}</GenericTableHeader>}
						<GenericTableBody>
							{isLoading && <GenericTableLoadingTable headerCells={headerCells} />}
							{!isLoading &&
								((RenderRow && results?.map((props, index) => <RenderRow key={'_id' in props ? props._id : index} {...props} />)) ||
									(children && results?.map(children)))}
						</GenericTableBody>
					</GenericTableV2>
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
