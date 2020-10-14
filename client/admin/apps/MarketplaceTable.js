import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState, useContext, useMemo } from 'react';

import GenericTable from '../../components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';
import { useResizeInlineBreakpoint } from '../../hooks/useResizeInlineBreakpoint';
import { useFilteredApps } from './hooks/useFilteredApps';
import { AppDataContext } from './AppProvider';
import MarketplaceRow from './MarketplaceRow';
import FilterByText from '../../components/FilterByText';

function MarketplaceTable() {
	const t = useTranslation();

	const [ref, onLargeBreakpoint, onMediumBreakpoint] = useResizeInlineBreakpoint([800, 600], 200);

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const { text, current, itemsPerPage } = params;
	const { data, dataCache, finishedLoading } = useContext(AppDataContext);
	const [filteredApps, filteredAppsCount] = useFilteredApps({
		filterFunction: useCallback(
			(text) => ({ name, marketplace }) => marketplace !== false && name.toLowerCase().indexOf(text.toLowerCase()) > -1,
			[],
		),
		text: useDebouncedValue(text, 500),
		current,
		itemsPerPage,
		sort: useDebouncedValue(sort, 200),
		data: useMemo(
			() => (data.length ? data : null),
			[dataCache],
		),
		dataCache,
	});

	const [sortBy, sortDirection] = sort;
	const onHeaderCellClick = (id) => {
		setSort(
			([sortBy, sortDirection]) => (
				sortBy === id
					? [id, sortDirection === 'asc' ? 'desc' : 'asc']
					: [id, 'asc']
			),
		);
	};

	return <GenericTable
		ref={ref}
		header={<>
			<GenericTable.HeaderCell
				direction={sortDirection}
				active={sortBy === 'name'}
				onClick={onHeaderCellClick}
				sort='name'
				width={onMediumBreakpoint ? 'x240' : 'x180'}
			>
				{t('Name')}
			</GenericTable.HeaderCell>
			{onLargeBreakpoint && <GenericTable.HeaderCell>
				{t('Details')}
			</GenericTable.HeaderCell>}
			{onMediumBreakpoint && <GenericTable.HeaderCell>
				{t('Price')}
			</GenericTable.HeaderCell>}
			<GenericTable.HeaderCell width='x160'>
				{t('Status')}
			</GenericTable.HeaderCell>
		</>}
		results={(filteredApps?.length || finishedLoading) && filteredApps}
		total={filteredAppsCount}
		setParams={setParams}
		params={params}
		renderFilter={({ onChange, ...props }) => <FilterByText placeholder={t('Search_Apps')} onChange={onChange} {...props} />}
	>
		{(props) => <MarketplaceRow
			key={props.id}
			medium={onMediumBreakpoint}
			large={onLargeBreakpoint}
			{...props}
		/>}
	</GenericTable>;
}

export default MarketplaceTable;
