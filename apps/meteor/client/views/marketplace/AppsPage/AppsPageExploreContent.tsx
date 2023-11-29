import { useBreakpoints, useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useRef } from 'react';

import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { AsyncStatePhase } from '../../../lib/asyncState';

import { useFilters } from '../context/FiltersContext';
import { Box } from '@rocket.chat/fuselage';
import AppsList from '../AppsList';
import CategoryDropDown from '../components/CategoryFilter/CategoryDropDown';
import TagList from '../components/CategoryFilter/TagList';
import RadioDropDown from '../components/RadioDropDown/RadioDropDown';
import FilterByText from '/client/components/FilterByText';
import AppsPagePagination from './AppsPagePagination';

import type { CategoryDropDownListProps, CategoryOnSelected, selectedCategoriesList } from '../definitions/CategoryDropdownDefinitions';
import type { App } from '@rocket.chat/core-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import { RadioDropDownOnSelected } from '../definitions/RadioDropDownDefinitions';

type AppsPageExploreContentProps = {
  appsResult: {
    phase: AsyncStatePhase;
    value: { items: App[] } & { shouldShowSearchText: boolean } & PaginatedResult & { allApps: App[] } & { totalAppsLength: number }
  };
  categories: CategoryDropDownListProps['categories'];
  selectedCategories: selectedCategoriesList;
  onSelected: CategoryOnSelected;
  categoryTagList: selectedCategoriesList;
  freePaidFilterOnSelected: RadioDropDownOnSelected;
  statusFilterOnSelected: RadioDropDownOnSelected;
  sortFilterOnSelected: RadioDropDownOnSelected;
};

const AppsPageExploreContent = ({
  appsResult,
  categories,
	selectedCategories,
	onSelected,
  categoryTagList,
  freePaidFilterOnSelected,
  statusFilterOnSelected,
  sortFilterOnSelected,
}: AppsPageExploreContentProps): ReactElement => {
	const t = useTranslation();
  const appsListId = useUniqueId();
  const scrollableRef = useRef<HTMLDivElement>(null);

  const {
    filters,
    setFilters,
    sortFilterStructure,
    freePaidFilterStructure,
    statusFilterStructure,
    text,
    setText,
    isFiltered,
  } = useFilters();
	
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	useEffect(() => {
		isFiltered &&
			setFilters({
				text,
				freePaidFilterStructure,
				statusFilterStructure,
				selectedCategories,
				sortFilterStructure,
			});
	}, [isFiltered, sortFilterStructure, freePaidFilterStructure, selectedCategories, text, statusFilterStructure, setFilters]);

  const breakpoints = useBreakpoints();
  const fixFiltersSize = breakpoints.includes('lg') ? { maxWidth: 'x200', minWidth: 'x200' } : null;

	return (
		<>
      {/* Filters */}
      <Box pi={24}>
        <FilterByText placeholder={t('Search_Apps')} onChange={({ text }): void => setText(text)}>
        <RadioDropDown group={freePaidFilterStructure} onSelected={freePaidFilterOnSelected} flexGrow={1} {...fixFiltersSize} />
        <RadioDropDown group={statusFilterStructure} onSelected={statusFilterOnSelected} flexGrow={1} {...fixFiltersSize} />
        <CategoryDropDown categories={categories} selectedCategories={selectedCategories} onSelected={onSelected} flexGrow={1} />
        <RadioDropDown group={sortFilterStructure} onSelected={sortFilterOnSelected} flexGrow={1} {...fixFiltersSize} />
        </FilterByText>
        <TagList categories={categoryTagList} onClick={onSelected} />
      </Box>

      {/* <AppsFilters
				context='explore'
				categories={categories}
				categoryTagList={categoryTagList}
				freePaidFilterOnSelected={freePaidFilterOnSelected}
				freePaidFilterStructure={freePaidFilterStructure}
				onSelected={onSelected}
				selectedCategories={selectedCategories}
				setText={setText}
				sortFilterOnSelected={sortFilterOnSelected}
				sortFilterStructure={sortFilterStructure}
				statusFilterOnSelected={statusFilterOnSelected}
				statusFilterStructure={statusFilterStructure}
			/> */}
      {/* Filters */}

      <Box display='flex' flexDirection='column' overflow='hidden' height='100%' pi={24}>
        <Box overflowY='scroll' height='100%' ref={scrollableRef}>
          <AppsList appsListId={appsListId} apps={appsResult.value.items || []} title={t('All_Apps')} />
        </Box>
      </Box>

      {/* Pagination */}
      {Boolean(appsResult?.value.count) && (
        <AppsPagePagination
          current={current}
          total={appsResult?.value.total}
          itemsPerPage={itemsPerPage}
          onSetItemsPerPage={onSetItemsPerPage}
          onSetCurrent={onSetCurrent}
          {...paginationProps}
        />
      )}
      {/* Pagination */}
		</>
	);
};

export default AppsPageExploreContent;
