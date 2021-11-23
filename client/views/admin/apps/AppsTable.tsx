import {
	Box,
	Fallback,
	FallbackAction,
	FallbackActions,
	FallbackIcon,
	FallbackSubtitle,
	FallbackSuggestion,
	FallbackSuggestionList,
	FallbackSuggestionListItem,
	FallbackSuggestionText,
	FallbackTitle,
	Pagination,
} from '@rocket.chat/fuselage';
import { useDebouncedState } from '@rocket.chat/fuselage-hooks';
import React, { FC } from 'react';

import FilterByText from '../../../components/FilterByText';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useResizeInlineBreakpoint } from '../../../hooks/useResizeInlineBreakpoint';
import { AsyncStatePhase } from '../../../lib/asyncState';
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

	const appsResult = useFilteredApps({
		filterFunction,
		text,
		current,
		itemsPerPage,
		sortDirection,
	});

	return (
		<>
			<FilterByText placeholder={t('Search_Apps')} onChange={({ text }): void => setText(text)} />
			{(appsResult.phase === AsyncStatePhase.LOADING ||
				(appsResult.phase === AsyncStatePhase.RESOLVED && Boolean(appsResult.value.count))) && (
				<>
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
							{onMediumBreakpoint && (
								<GenericTableHeaderCell>{t('Details')}</GenericTableHeaderCell>
							)}
							<GenericTableHeaderCell width='x160'>{t('Status')}</GenericTableHeaderCell>
						</GenericTableHeader>
						<GenericTableBody>
							{appsResult.phase === AsyncStatePhase.LOADING && (
								<GenericTableLoadingTable headerCells={onMediumBreakpoint ? 3 : 2} />
							)}
							{appsResult.phase === AsyncStatePhase.RESOLVED &&
								appsResult.value.items.map((app) => (
									<Row
										key={app.id}
										large={onLargeBreakpoint}
										medium={onMediumBreakpoint}
										{...app}
									/>
								))}
						</GenericTableBody>
					</GenericTable>
					{appsResult.phase === AsyncStatePhase.RESOLVED && (
						<Pagination
							current={current}
							itemsPerPage={itemsPerPage}
							count={appsResult.value.total}
							onSetItemsPerPage={onSetItemsPerPage}
							onSetCurrent={onSetCurrent}
							{...paginationProps}
						/>
					)}
				</>
			)}

			{appsResult.phase === AsyncStatePhase.RESOLVED &&
				isMarketplace &&
				appsResult.value.count === 0 && (
					<Box mbs='x20'>
						<Fallback>
							<FallbackIcon name='magnifier' />
							<FallbackTitle>No app matches</FallbackTitle>
							<FallbackSubtitle>
								No Marketplace matches for:
								<strong>"{text}"</strong>
							</FallbackSubtitle>
							<FallbackSuggestion>
								<FallbackSuggestionText>You can try to:</FallbackSuggestionText>
								<FallbackSuggestionList>
									<FallbackSuggestionListItem>Search by category</FallbackSuggestionListItem>
									<FallbackSuggestionListItem>
										Search for a more general term
									</FallbackSuggestionListItem>
									<FallbackSuggestionListItem>
										Search for a more specific term
									</FallbackSuggestionListItem>
									<FallbackSuggestionListItem>
										Check if the spelling is correct
									</FallbackSuggestionListItem>
								</FallbackSuggestionList>
							</FallbackSuggestion>
						</Fallback>
					</Box>
				)}

			{appsResult.phase === AsyncStatePhase.RESOLVED &&
				!isMarketplace &&
				appsResult.value.total === 0 && (
					<Box mbs='x20'>
						<Fallback>
							<FallbackIcon name='magnifier' />
							<FallbackTitle>No Apps Installed</FallbackTitle>
							<FallbackSubtitle>
								Explore the Marketplace to find awesome apps for Rocket.Chat
							</FallbackSubtitle>
							<FallbackActions>
								<FallbackAction>Explore Marketplace</FallbackAction>
							</FallbackActions>
						</Fallback>
					</Box>
				)}

			{appsResult.phase === AsyncStatePhase.RESOLVED &&
				!isMarketplace &&
				appsResult.value.total !== 0 &&
				appsResult.value.count === 0 && (
					<Box mbs='x20'>
						<Fallback>
							<FallbackIcon name='magnifier' />
							<FallbackTitle>No installed app matches</FallbackTitle>
							<FallbackSubtitle>
								<span>
									No app matches for <strong>"{text}"</strong>
								</span>
							</FallbackSubtitle>
							<FallbackSuggestion>
								<FallbackSuggestionText>
									Try searching in the Marketplace instead
								</FallbackSuggestionText>
							</FallbackSuggestion>
							<FallbackActions>
								<FallbackAction>Search on Marketplace</FallbackAction>
							</FallbackActions>
						</Fallback>
					</Box>
				)}
		</>
	);
};

export default AppsTable;
