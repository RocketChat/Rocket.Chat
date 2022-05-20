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
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useMemo, useState } from 'react';

import FilterByText from '../../../components/FilterByText';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useResizeInlineBreakpoint } from '../../../hooks/useResizeInlineBreakpoint';
import { AsyncStatePhase } from '../../../lib/asyncState';
import AppRow from './AppRow';
import { useAppsReload, useAppsResult } from './AppsContext';
import MarketplaceRow from './MarketplaceRow';
import CategoryDropDown from './components/CategoryFilter/CategoryDropDown';
import TagList from './components/CategoryFilter/TagList';
import RadioDropDown from './components/RadioDropDown/RadioDropDown';
import { RadioDropDownGroup } from './definitions/RadioDropDownDefinitions';
import { useCategories } from './hooks/useCategories';
import { useFilteredApps } from './hooks/useFilteredApps';
import { useRadioToggle } from './hooks/useRadioToggle';

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

	const reload = useAppsReload();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const [freePaidFilterStructure, setFreePaidFilterStructure] = useState<RadioDropDownGroup>({
		label: t('Filter_By_Price'),
		items: [
			{ id: 'all', label: t('All_Apps'), checked: true },
			{ id: 'free', label: t('Free_Apps'), checked: false },
			{ id: 'paid', label: t('Paid_Apps'), checked: false },
		],
	});

	const freePaidFilterOnSelected = useRadioToggle(setFreePaidFilterStructure);

	const [categories, selectedCategories, categoryTagList, onSelected] = useCategories();

	const [sortFilterStructure, setSortFilterStructure] = useState<RadioDropDownGroup>({
		label: 'Sort by',
		items: [
			{ id: 'az', label: 'A-Z', checked: true },
			{ id: 'za', label: 'Z-A', checked: false },
			{ id: 'mru', label: t('Most_recent_updated'), checked: false },
			{ id: 'lru', label: t('Least_recent_updated'), checked: false },
		],
	});

	const sortFilterOnSelected = useRadioToggle(setSortFilterStructure);

	const appsResult = useFilteredApps({
		appsData: isMarketplace ? marketplaceApps : installedApps,
		text,
		current,
		itemsPerPage,
		categories: useMemo(() => selectedCategories.map(({ label }) => label), [selectedCategories]),
		purchaseType: useMemo(() => freePaidFilterStructure.items.find(({ checked }) => checked)?.id, [freePaidFilterStructure]),
		sortingMethod: useMemo(() => sortFilterStructure.items.find(({ checked }) => checked)?.id, [sortFilterStructure]),
	});

	return (
		<>
			{/* TODO Divide into two components: Filters and AppsTable */}
			<FilterByText placeholder={t('Search_Apps')} onChange={({ text }): void => setText(text)}>
				<RadioDropDown group={freePaidFilterStructure} onSelected={freePaidFilterOnSelected} mie='x8' />
				<CategoryDropDown data={categories} selectedCategories={selectedCategories} onSelected={onSelected} />
				<RadioDropDown group={sortFilterStructure} onSelected={sortFilterOnSelected} mis='x8' />
			</FilterByText>
			<TagList categories={categoryTagList} onClick={onSelected} />
			{(appsResult.phase === AsyncStatePhase.LOADING ||
				(appsResult.phase === AsyncStatePhase.RESOLVED && Boolean(appsResult.value.count))) && (
				<>
					<GenericTable ref={ref}>
						<GenericTableHeader>
							<GenericTableHeaderCell width={onMediumBreakpoint ? 'x240' : 'x180'}>{t('Name')}</GenericTableHeaderCell>
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
