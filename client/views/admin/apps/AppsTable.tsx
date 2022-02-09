import {
	Box,
	States,
	StatesAction,
	StatesActions,
	StatesIcon,
	StatesSubtitle,
	StatesSuggestion,
	StatesSuggestionList,
	StatesSuggestionListItem,
	StatesSuggestionText,
	StatesTitle,
	Pagination,
	Icon,
} from '@rocket.chat/fuselage';
import { useDebouncedState } from '@rocket.chat/fuselage-hooks';
import React, { FC, useMemo } from 'react';

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
import { useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useResizeInlineBreakpoint } from '../../../hooks/useResizeInlineBreakpoint';
import { AsyncStatePhase } from '../../../lib/asyncState';
import AppRow from './AppRow';
import { useAppsReload, useAppsResult } from './AppsContext';
import MarketplaceRow from './MarketplaceRow';
import CategoryDropDown from './components/CategoryDropDown';
import TagList from './components/TagList';
import { useCategories } from './hooks/useCategories';
import { useFilteredApps } from './hooks/useFilteredApps';

const AppsTable: FC<{
	isMarketplace: boolean;
}> = ({ isMarketplace }) => {
	const t = useTranslation();

	const [ref, onLargeBreakpoint, onMediumBreakpoint] = useResizeInlineBreakpoint([800, 600], 200) as [
		React.RefObject<HTMLElement>,
		boolean,
		boolean,
	];

	const { marketplaceApps, installedApps } = useAppsResult();

	const marketplaceRoute = useRoute('admin-marketplace');

	const Row = isMarketplace ? MarketplaceRow : AppRow;

	const [text, setText] = useDebouncedState('', 500);

	const { sortBy, sortDirection, setSort } = useSort<'name'>('name');

	const reload = useAppsReload();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const [categories, selectedCategories, categoryTagList, onSelected] = useCategories();

	const appsResult = useFilteredApps({
		appsData: isMarketplace ? marketplaceApps : installedApps,
		text,
		current,
		itemsPerPage,
		sortDirection,
		categories: useMemo(() => selectedCategories.map(({ label }) => label), [selectedCategories]),
	});

	return (
		<>
			<FilterByText placeholder={t('Search_Apps')} onChange={({ text }): void => setText(text)}>
				<CategoryDropDown data={categories} onSelected={onSelected} />
			</FilterByText>
			<TagList categories={categoryTagList} onClick={onSelected} />
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
							{onMediumBreakpoint && <GenericTableHeaderCell>{t('Details')}</GenericTableHeaderCell>}
							{isMarketplace && <GenericTableHeaderCell>{t('Price')}</GenericTableHeaderCell>}

							<GenericTableHeaderCell width='x160'>{t('Status')}</GenericTableHeaderCell>
						</GenericTableHeader>
						<GenericTableBody>
							{appsResult.phase === AsyncStatePhase.LOADING && (
								<GenericTableLoadingTable
									// eslint-disable-next-line no-nested-ternary
									headerCells={onMediumBreakpoint ? (isMarketplace ? 4 : 3) : 2}
								/>
							)}
							{appsResult.phase === AsyncStatePhase.RESOLVED &&
								appsResult.value.items.map((app) => <Row key={app.id} large={onLargeBreakpoint} medium={onMediumBreakpoint} {...app} />)}
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
			{appsResult.phase === AsyncStatePhase.RESOLVED && isMarketplace && appsResult.value.count === 0 && (
				<Box mbs='x20'>
					<States>
						<StatesIcon name='magnifier' />
						<StatesTitle>{t('No_app_matches')}</StatesTitle>
						{appsResult.value.shouldShowSearchText ? (
							<StatesSubtitle>
								{t('No_marketplace_matches_for')}: <strong>"{text}"</strong>
							</StatesSubtitle>
						) : (
							''
						)}
						<StatesSuggestion>
							<StatesSuggestionText>{t('You_can_try_to')}:</StatesSuggestionText>
							<StatesSuggestionList>
								<StatesSuggestionListItem>{t('Search_by_category')}</StatesSuggestionListItem>
								<StatesSuggestionListItem>{t('Search_for_a_more_general_term')}</StatesSuggestionListItem>
								<StatesSuggestionListItem>{t('Search_for_a_more_specific_term')}</StatesSuggestionListItem>
								<StatesSuggestionListItem>{t('Check_if_the_spelling_is_correct')}</StatesSuggestionListItem>
							</StatesSuggestionList>
						</StatesSuggestion>
					</States>
				</Box>
			)}
			{appsResult.phase === AsyncStatePhase.RESOLVED && !isMarketplace && appsResult.value.total === 0 && (
				<Box mbs='x20'>
					<States>
						<StatesIcon name='magnifier' />
						<StatesTitle>{t('No_apps_installed')}</StatesTitle>
						<StatesSubtitle>{t('Explore_the_marketplace_to_find_awesome_apps')}</StatesSubtitle>
						<StatesActions>
							<StatesAction onClick={(): void => marketplaceRoute.push({ context: '' })}>{t('Explore_marketplace')}</StatesAction>
						</StatesActions>
					</States>
				</Box>
			)}
			{appsResult.phase === AsyncStatePhase.RESOLVED && !isMarketplace && appsResult.value.total !== 0 && appsResult.value.count === 0 && (
				<Box mbs='x20'>
					<States>
						<StatesIcon name='magnifier' />
						<StatesTitle>{t('No_installed_app_matches')}</StatesTitle>
						{appsResult.value.shouldShowSearchText ? (
							<StatesSubtitle>
								<span>
									{t('No_app_matches_for')} <strong>"{text}"</strong>
								</span>
							</StatesSubtitle>
						) : (
							''
						)}
						<StatesSuggestion>
							<StatesSuggestionText>{t('Try_searching_in_the_marketplace_instead')}</StatesSuggestionText>
						</StatesSuggestion>
						<StatesActions>
							<StatesAction onClick={(): void => marketplaceRoute.push({ context: '' })}>{t('Search_on_marketplace')}</StatesAction>
						</StatesActions>
					</States>
				</Box>
			)}
			{/* TODO: Create error variations for empty search message */}
			{appsResult.phase === AsyncStatePhase.REJECTED && (
				<Box mbs='x20'>
					<States>
						<StatesIcon variation='danger' name='circle-exclamation' />
						<StatesTitle>{t('Connection_error')}</StatesTitle>
						<StatesSubtitle>{t('Marketplace_error')}</StatesSubtitle>
						<StatesActions>
							<StatesAction onClick={reload}>
								<Icon mie='x4' size='x20' name='reload' />
								{t('Reload_page')}
							</StatesAction>
						</StatesActions>
					</States>
				</Box>
			)}
		</>
	);
};

export default AppsTable;
