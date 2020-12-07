import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useResizeInlineBreakpoint } from '../../../hooks/useResizeInlineBreakpoint';
import { useFilteredApps } from './hooks/useFilteredApps';
import AppRow from './AppRow';
import FilterByText from '../../../components/FilterByText';

const filterFunction = (text) => {
	if (!text) {
		return (app) => app.installed;
	}

	return (app) => app.installed && app.name.toLowerCase().indexOf(text.toLowerCase()) > -1;
};

function AppsTable() {
	const t = useTranslation();

	const [ref, onMediumBreakpoint] = useResizeInlineBreakpoint([600], 200);

	const [params, setParams] = useState(() => ({ text: '', current: 0, itemsPerPage: 25 }));
	const [sort, setSort] = useState(() => ['name', 'asc']);

	const { text, current, itemsPerPage } = params;

	const [filteredApps, filteredAppsCount] = useFilteredApps({
		filterFunction,
		text: useDebouncedValue(text, 500),
		current,
		itemsPerPage,
		sort: useDebouncedValue(sort, 200),
	});

	const [sortBy, sortDirection] = sort;

	const handleHeaderCellClick = (id) => {
		setSort(
			([sortBy, sortDirection]) =>
				(sortBy === id
					? [id, sortDirection === 'asc' ? 'desc' : 'asc']
					: [id, 'asc']),
		);
	};

	return <GenericTable
		ref={ref}
		header={<>
			<GenericTable.HeaderCell
				direction={sortDirection}
				active={sortBy === 'name'}
				sort='name'
				width={onMediumBreakpoint ? 'x240' : 'x180'}
				onClick={handleHeaderCellClick}
			>
				{t('Name')}
			</GenericTable.HeaderCell>
			{onMediumBreakpoint && <GenericTable.HeaderCell>
				{t('Details')}
			</GenericTable.HeaderCell>}
			<GenericTable.HeaderCell width='x160'>
				{t('Status')}
			</GenericTable.HeaderCell>
		</>}
		results={filteredApps}
		total={filteredAppsCount}
		params={params}
		setParams={setParams}
		renderFilter={({ onChange, ...props }) => <FilterByText placeholder={t('Search_Apps')} onChange={onChange} {...props} />}
	>
		{(props) => <AppRow key={props.id} medium={onMediumBreakpoint} {...props} />}
	</GenericTable>;
}

export default AppsTable;
