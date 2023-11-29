import { useDebouncedState } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useMemo, useState, useCallback } from 'react';

import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useAppsResult } from '../../../contexts/hooks/useAppsResult';
import { AsyncStatePhase } from '../../../lib/asyncState';
import type { RadioDropDownGroup, RadioDropDownSetData } from '../definitions/RadioDropDownDefinitions';
import { useCategories } from '../hooks/useCategories';
import type { appsDataType } from '../hooks/useFilteredApps';
import { useFilteredApps } from '../hooks/useFilteredApps';
import { useRadioToggle } from '../hooks/useRadioToggle';
import AppsFilters from './AppsFilters';
import AppsPageConnectionError from './AppsPageConnectionError';
import AppsPageContentBody from './AppsPageContentBody';
import AppsPageContentSkeleton from './AppsPageContentSkeleton';
import NoAppRequestsEmptyState from './NoAppRequestsEmptyState';
import NoInstalledAppMatchesEmptyState from './NoInstalledAppMatchesEmptyState';
import NoInstalledAppsEmptyState from './NoInstalledAppsEmptyState';
import NoMarketplaceOrInstalledAppMatchesEmptyState from './NoMarketplaceOrInstalledAppMatchesEmptyState';
import PrivateEmptyState from './PrivateEmptyState';
import { useFilters } from '../context/FiltersContext';
import AppsPageExploreContent from './AppsPageExploreContent';
import AppsPagePremiumContent from './AppsPagePremiumContent';

const AppsPageContent = (): ReactElement => {
	const t = useTranslation();
	const { marketplaceApps, installedApps, privateApps, reload } = useAppsResult();

	// const { filters, setFilters } = useFilters();
	// const [text, setText] = useDebouncedState(filters?.text || '', 500);
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	// const router = useRouter();

	const context = useRouteParameter('context');

	const isMarketplace = context === 'explore';
	const isPremium = context === 'premium';
	const isRequested = context === 'requested';

	const {
		filters,
    setFilters,
    freePaidFilterStructure,
    setFreePaidFilterStructure,
    statusFilterStructure,
    setStatusFilterStructure,
    sortFilterStructure,
    setSortFilterStructure,
    text,
		resetFilters,
		isFiltered,
  } = useFilters();

	const freePaidFilterOnSelected = useRadioToggle(setFreePaidFilterStructure);
	const statusFilterOnSelected = useRadioToggle(setStatusFilterStructure);
	const sortFilterOnSelected = useRadioToggle(setSortFilterStructure);

	const getAppsData = useCallback((): appsDataType => {
		switch (context) {
			case 'premium':
			case 'explore':
			case 'requested':
				return marketplaceApps;
			case 'private':
				return privateApps;
			default:
				return installedApps;
		}
	}, [context, marketplaceApps, installedApps, privateApps]);

	const findSort = () => {
		const possibleSort = sortFilterStructure.items?.find(({ checked }) => checked);
		return possibleSort ? possibleSort.id : 'mru';
	};

	const findPurchaseType = () => {
		const possiblePurchaseType = freePaidFilterStructure.items?.find(({ checked }: { checked: any; }) => checked);
		return possiblePurchaseType ? possiblePurchaseType.id : 'all';
	};

	const findStatus = () => {
		const possibleStatus = statusFilterStructure.items?.find(({ checked }: { checked: any; }) => checked);
		return possibleStatus ? possibleStatus.id : 'all';
	};

	const [categories, selectedCategories, categoryTagList, onSelected] = useCategories();
	
	const appsResult = useFilteredApps({
		appsData: getAppsData(),
		text,
		current,
		itemsPerPage,
		categories: useMemo(() => selectedCategories.map(({ label }) => label), [selectedCategories]),
		purchaseType: useMemo(findPurchaseType, [freePaidFilterStructure]),
		sortingMethod: useMemo(findSort, [sortFilterStructure]),
		status: useMemo(findStatus, [statusFilterStructure]),
		context,
	});

	const toggleInitialSortOption = useCallback((isRequested: boolean) => {
		setSortFilterStructure((prevState) => {
			prevState?.items?.forEach((currentItem) => {
				if (isRequested && currentItem.id === 'urf') {
					currentItem.checked = true;
					return;
				}

				if (!isRequested && currentItem.id === 'mru') {
					currentItem.checked = true;
					return;
				}

				currentItem.checked = false;
			});

			return { ...prevState };
		});
	}, []);

	useEffect(() => {
		toggleInitialSortOption(isRequested);
	}, [isMarketplace, isRequested, sortFilterOnSelected, t, toggleInitialSortOption]);

	// useEffect(() => {
	// 	console.log('resetFilters', context)
	// 	resetFilters();
	// }, [context]);

	const noInstalledApps = appsResult.phase === AsyncStatePhase.RESOLVED && !isMarketplace && appsResult.value.totalAppsLength === 0;

	const renderAppsPageContent = () => {
		if (isPremium) {
			return (
				<AppsPagePremiumContent
					appsResult={appsResult}
					categories={categories}
					selectedCategories={selectedCategories}
					onSelected={onSelected}
					categoryTagList={categoryTagList}
					freePaidFilterOnSelected={freePaidFilterOnSelected}
					statusFilterOnSelected={statusFilterOnSelected}
					sortFilterOnSelected={sortFilterOnSelected}
					{ ...paginationProps }
				/>
			);
		}

		return (
			<AppsPageExploreContent
				appsResult={appsResult}
				categories={categories}
				selectedCategories={selectedCategories}
				onSelected={onSelected}
				categoryTagList={categoryTagList}
				freePaidFilterOnSelected={freePaidFilterOnSelected}
				statusFilterOnSelected={statusFilterOnSelected}
				sortFilterOnSelected={sortFilterOnSelected}
				{ ...paginationProps }
			/>
		)
	}

	return (
		<>			
			{appsResult.phase === AsyncStatePhase.REJECTED && <AppsPageConnectionError onButtonClick={reload} />}

			{appsResult.phase === AsyncStatePhase.RESOLVED && !noInstalledApps && (
				renderAppsPageContent()
			)}
			
		</>
	);
};

export default AppsPageContent;
