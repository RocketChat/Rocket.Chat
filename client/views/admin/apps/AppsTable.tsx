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
} from '@rocket.chat/fuselage';
import { useDebouncedState } from '@rocket.chat/fuselage-hooks';
import React, { FC, useState } from 'react';

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
import MarketplaceRow from './MarketplaceRow';
import { filterAppsInstalled } from './helpers/filterAppsInstalled';
import { filterAppsMarketplace } from './helpers/filterAppsMarketplace';
import { useFilteredApps } from './hooks/useFilteredApps';
import CategoryDropDown from './components/CategoryDropDown';
import { useCategoryToggle } from './hooks/useCategoryToggle';
import { CategoryDropDownListProps } from './definitions/CategoryDropdownDefinitions';
import { useCategoryTagList } from './hooks/useCategoryTagList';
import TagList from './components/TagList';

const AppsTable: FC<{
	isMarketplace: boolean;
}> = ({ isMarketplace }) => {
	const t = useTranslation();

	const [ref, onLargeBreakpoint, onMediumBreakpoint] = useResizeInlineBreakpoint(
		[800, 600],
		200,
	) as [React.RefObject<HTMLElement>, boolean, boolean];

	const marketplaceRoute = useRoute('admin-marketplace');

	const filterFunction = isMarketplace ? filterAppsMarketplace : filterAppsInstalled;

	const Row = isMarketplace ? MarketplaceRow : AppRow;

	const [text, setText] = useDebouncedState('', 500);

	const { sortBy, sortDirection, setSort } = useSort<'name'>('name');

	const categoriesTemp: CategoryDropDownListProps['groups'] = [
		{
			items: [
				{
					id: 'all',
					label: 'All categories',
				},
			],
		},
		{
			label: 'Filter by Category',
			items: [
				{ id: '0', label: 'Analytics', checked: true },
				{ id: '1', label: 'Bots', checked: true },
				{ id: '2', label: 'Communication', checked: true },
				{ id: '3', label: 'Content Management', checked: true },
				{ id: '4', label: 'Customer Support', checked: true },
				{ id: '5', label: 'Design', checked: true },
				{ id: '6', label: 'Developer Tools', checked: true },
				{ id: '7', label: 'File Management', checked: true },
				{ id: '8', label: 'Finance', checked: true },
				{ id: '9', label: 'Health & Wellness', checked: true },
				{ id: '10', label: 'Human Resources', checked: true },
				{ id: '11', label: 'Marketing', checked: true },
				{ id: '12', label: 'Media & News', checked: true },
				{ id: '13', label: 'Office Management', checked: true },
				{ id: '14', label: 'Omnichannel', checked: true },
				{ id: '15', label: 'Other', checked: true },
				{ id: '16', label: 'Productivity', checked: true },
				{ id: '17', label: 'Project Management', checked: true },
				{ id: '18', label: 'Sales', checked: true },
				{ id: '19', label: 'Security & Compliance', checked: true },
				{ id: '20', label: 'Social & Fun', checked: true },
				{ id: '21', label: 'Team Culture', checked: true },
				{ id: '22', label: 'Travel', checked: true },
				{ id: '23', label: 'Voice & Video', checked: true },
			],
		},
	];

	const [categoriesList, setCategoriesList] = useState(() => categoriesTemp);

	const onSelected = useCategoryToggle(setCategoriesList);

	const selectedCategories = useCategoryTagList(categoriesList);

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
		categories: selectedCategories.map((currentCategory) => currentCategory.label),
	});

	return (
		<>
			<Box display='flex' alignItems='center' width='100%'>
				<FilterByText placeholder={t('Search_Apps')} onChange={({ text }): void => setText(text)} />
				<CategoryDropDown data={categoriesList} onSelected={onSelected} mis='8px' />
			</Box>

			<Box display='flex'>
				<TagList categories={selectedCategories} onClick={onSelected} tagGap='8px' />
			</Box>

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
						<States>
							<StatesIcon name='magnifier' />
							<StatesTitle>{t('No_app_matches')}</StatesTitle>
							<StatesSubtitle>
								{t('No_marketplace_matches_for')}: <strong>"{text}"</strong>
							</StatesSubtitle>
							<StatesSuggestion>
								<StatesSuggestionText>{t('You_can_try_to')}:</StatesSuggestionText>
								<StatesSuggestionList>
									<StatesSuggestionListItem>{t('Search_by_category')}</StatesSuggestionListItem>
									<StatesSuggestionListItem>
										{t('Search_for_a_more_general_term')}
									</StatesSuggestionListItem>
									<StatesSuggestionListItem>
										{t('Search_for_a_more_specific_term')}
									</StatesSuggestionListItem>
									<StatesSuggestionListItem>
										{t('Check_if_the_spelling_is_correct')}
									</StatesSuggestionListItem>
								</StatesSuggestionList>
							</StatesSuggestion>
						</States>
					</Box>
				)}

			{appsResult.phase === AsyncStatePhase.RESOLVED &&
				!isMarketplace &&
				appsResult.value.total === 0 && (
					<Box mbs='x20'>
						<States>
							<StatesIcon name='magnifier' />
							<StatesTitle>{t('No_apps_installed')}</StatesTitle>
							<StatesSubtitle>{t('Explore_the_marketplace_to_find_awesome_apps')}</StatesSubtitle>
							<StatesActions>
								<StatesAction onClick={(): void => marketplaceRoute.push({ context: '' })}>
									{t('Explore_marketplace')}
								</StatesAction>
							</StatesActions>
						</States>
					</Box>
				)}

			{appsResult.phase === AsyncStatePhase.RESOLVED &&
				!isMarketplace &&
				appsResult.value.total !== 0 &&
				appsResult.value.count === 0 && (
					<Box mbs='x20'>
						<States>
							<StatesIcon name='magnifier' />
							<StatesTitle>{t('No_installed_app_matches')}</StatesTitle>
							<StatesSubtitle>
								<span>
									{t('No_app_matches_for')} <strong>"{text}"</strong>
								</span>
							</StatesSubtitle>
							<StatesSuggestion>
								<StatesSuggestionText>
									{t('Try_searching_in_the_marketplace_instead')}
								</StatesSuggestionText>
							</StatesSuggestion>
							<StatesActions>
								<StatesAction onClick={(): void => marketplaceRoute.push({ context: '' })}>
									{t('Search_on_marketplace')}
								</StatesAction>
							</StatesActions>
						</States>
					</Box>
				)}
		</>
	);
};

export default AppsTable;
