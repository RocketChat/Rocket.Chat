import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useState, useContext } from 'react';

import FilterByText from '../../../components/FilterByText';
import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useResizeInlineBreakpoint } from '../../../hooks/useResizeInlineBreakpoint';
import { AppsContext } from './AppsContext';
import MarketplaceRow from './MarketplaceRow';
import { useFilteredApps } from './hooks/useFilteredApps';

const filterFunction =
	(text) =>
	({ name, marketplace }) =>
		marketplace !== false && name.toLowerCase().indexOf(text.toLowerCase()) > -1;

function MarketplaceTable() {
	const t = useTranslation();

	const [ref, onLargeBreakpoint, onMediumBreakpoint] = useResizeInlineBreakpoint([800, 600], 200);

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const { text, current, itemsPerPage } = params;

	const [filteredApps, filteredAppsCount] = useFilteredApps({
		filterFunction,
		text: useDebouncedValue(text, 500),
		current,
		itemsPerPage,
		sort: useDebouncedValue(sort, 200),
	});

	const { finishedLoading } = useContext(AppsContext);

	const [sortBy, sortDirection] = sort;
	const onHeaderCellClick = (id) => {
		setSort(([sortBy, sortDirection]) =>
			sortBy === id ? [id, sortDirection === 'asc' ? 'desc' : 'asc'] : [id, 'asc'],
		);
	};

	return (
		<GenericTable
			ref={ref}
			header={
				<>
					<GenericTable.HeaderCell
						direction={sortDirection}
						active={sortBy === 'name'}
						onClick={onHeaderCellClick}
						sort='name'
						width={onMediumBreakpoint ? 'x240' : 'x180'}
					>
						{t('Name')}
					</GenericTable.HeaderCell>
					{onLargeBreakpoint && <GenericTable.HeaderCell>{t('Details')}</GenericTable.HeaderCell>}
					{onMediumBreakpoint && <GenericTable.HeaderCell>{t('Price')}</GenericTable.HeaderCell>}
					<GenericTable.HeaderCell width='x160'>{t('Status')}</GenericTable.HeaderCell>
				</>
			}
			results={(filteredApps?.length || finishedLoading) && filteredApps}
			total={filteredAppsCount}
			setParams={setParams}
			params={params}
			renderFilter={({ onChange, ...props }) => (
				<FilterByText placeholder={t('Search_Apps')} onChange={onChange} {...props} />
			)}
		>
			{(props) => (
				<MarketplaceRow
					key={props.id}
					medium={onMediumBreakpoint}
					large={onLargeBreakpoint}
					{...props}
				/>
			)}
		</GenericTable>
	);
}

export default MarketplaceTable;
