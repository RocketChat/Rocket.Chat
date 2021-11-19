import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedState } from '@rocket.chat/fuselage-hooks';
import React, { FC } from 'react';

import FilterByText from '../../../components/FilterByText';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useResizeInlineBreakpoint } from '../../../hooks/useResizeInlineBreakpoint';
import AppRow from './AppRow';
import MarketplaceRow from './MarketplaceRow';
import { filterAppsInstalled } from './helpers/filterAppsInstalled';
import { filterAppsMarketplace } from './helpers/filterAppsMarketplace';
import { useFilteredApps } from './hooks/useFilteredApps';

const AppsTable: FC<{
	isMarketplace: boolean;
}> = ({ isMarketplace }) => {
	const t = useTranslation();

	const [ref, onLargeBreakpoint, onMediumBreakpoint] = useResizeInlineBreakpoint(
		[800, 600],
		200,
	) as [React.RefObject<HTMLElement>, boolean, boolean];

	const filterFunction = isMarketplace ? filterAppsMarketplace : filterAppsInstalled;

	const Row = isMarketplace ? MarketplaceRow : AppRow;

	const [text, setText] = useDebouncedState('', 500);

	const { sortBy, sortDirection, setSort } = useSort<'name'>('name');

	const {
		current,
		itemsPerPage,
		setItemsPerPage: onSetItemsPerPage,
		setCurrent: onSetCurrent,
		...paginationProps
	} = usePagination();

	const [filteredApps, filteredAppsCount] = useFilteredApps({
		filterFunction,
		text,
		current,
		itemsPerPage,
		sortDirection,
	});

	return (
		<>
			<FilterByText placeholder={t('Search_Apps')} onChange={({ text }): void => setText(text)} />
			<GenericTable ref={ref}>
				<GenericTableHeader>
					<GenericTableHeaderCell
						direction={sortDirection}
						active={sortBy === 'name'}
						sort='name'
						width={onMediumBreakpoint ? 'x240' : 'x180'}
						onClick={setSort}
					>
						{t('Name')}
					</GenericTableHeaderCell>
					{onMediumBreakpoint && <GenericTableHeaderCell>{t('Details')}</GenericTableHeaderCell>}
					<GenericTableHeaderCell width='x160'>{t('Status')}</GenericTableHeaderCell>
				</GenericTableHeader>
				<GenericTableBody>
					{filteredApps &&
						filteredApps.map((app) => (
							<Row key={app.id} large={onLargeBreakpoint} medium={onMediumBreakpoint} {...app} />
						))}
				</GenericTableBody>
			</GenericTable>
			<Pagination
				current={current}
				itemsPerPage={itemsPerPage}
				count={filteredAppsCount}
				onSetItemsPerPage={onSetItemsPerPage}
				onSetCurrent={onSetCurrent}
				{...paginationProps}
			/>
		</>
	);
};

export default AppsTable;
