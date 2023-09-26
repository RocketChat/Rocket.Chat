import { useDebouncedState } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useMemo, useState, useCallback } from 'react';

import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useAppsResult } from '../../../contexts/hooks/useAppsResult';
import { AsyncStatePhase } from '../../../lib/asyncState';
import type { RadioDropDownGroup } from '../definitions/RadioDropDownDefinitions';
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

const AppsPageContent = (): ReactElement => {
	const t = useTranslation();
	const { marketplaceApps, installedApps, privateApps, reload } = useAppsResult();
	const [text, setText] = useDebouncedState('', 500);
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const router = useRouter();

	const context = useRouteParameter('context');

	const isMarketplace = context === 'explore';
	const isRequested = context === 'requested';

	const [freePaidFilterStructure, setFreePaidFilterStructure] = useState({
		label: t('Filter_By_Price'),
		items: [
			{ id: 'all', label: t('All_Prices'), checked: true },
			{ id: 'free', label: t('Free_Apps'), checked: false },
			{ id: 'paid', label: t('Paid_Apps'), checked: false },
			{ id: 'enterprise', label: t('Enterprise'), checked: false },
		],
	});
	const freePaidFilterOnSelected = useRadioToggle(setFreePaidFilterStructure);

	const [statusFilterStructure, setStatusFilterStructure] = useState({
		label: t('Filter_By_Status'),
		items: [
			{ id: 'all', label: t('All_status'), checked: true },
			{ id: 'enabled', label: t('Enabled'), checked: false },
			{ id: 'disabled', label: t('Disabled'), checked: false },
		],
	});
	const statusFilterOnSelected = useRadioToggle(setStatusFilterStructure);

	const baseFilterStructureItems = [
		{ id: 'az', label: 'A-Z', checked: false },
		{ id: 'za', label: 'Z-A', checked: false },
		{ id: 'mru', label: t('Most_recent_updated'), checked: true },
		{ id: 'lru', label: t('Least_recent_updated'), checked: false },
	];

	const requestedFilterItems = [
		{ id: 'urf', label: t('Unread_Requested_First'), checked: false },
		{ id: 'url', label: t('Unread_Requested_Last'), checked: false },
	];

	const createFilterStructureItems = () => {
		return isRequested ? [...requestedFilterItems, ...baseFilterStructureItems] : baseFilterStructureItems;
	};

	const [sortFilterStructure, setSortFilterStructure] = useState<RadioDropDownGroup>(() => {
		return {
			label: t('Sort_By'),
			items: createFilterStructureItems(),
		};
	});

	useEffect(() => {
		setSortFilterStructure({
			label: t('Sort_By'),
			items: createFilterStructureItems(),
		});
	}, [isRequested]);

	const sortFilterOnSelected = useRadioToggle(setSortFilterStructure);

	const getAppsData = useCallback((): appsDataType => {
		switch (context) {
			case 'enterprise':
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
		const possibleSort = sortFilterStructure.items.find(({ checked }) => checked);

		return possibleSort ? possibleSort.id : 'mru';
	};

	const findPurchaseType = () => {
		const possiblePurchaseType = freePaidFilterStructure.items.find(({ checked }) => checked);

		return possiblePurchaseType ? possiblePurchaseType.id : 'all';
	};

	const findStatus = () => {
		const possibleStatus = statusFilterStructure.items.find(({ checked }) => checked);

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

	const noInstalledApps = appsResult.phase === AsyncStatePhase.RESOLVED && !isMarketplace && appsResult.value.totalAppsLength === 0;

	const noMarketplaceOrInstalledAppMatches = appsResult.phase === AsyncStatePhase.RESOLVED && isMarketplace && appsResult.value.count === 0;

	const noInstalledAppMatches =
		appsResult.phase === AsyncStatePhase.RESOLVED &&
		context === 'installed' &&
		appsResult.value.totalAppsLength !== 0 &&
		appsResult.value.count === 0;

	const noAppRequests = context === 'requested' && appsResult?.value?.totalAppsLength !== 0 && appsResult?.value?.count === 0;

	const noErrorsOcurred = !noMarketplaceOrInstalledAppMatches && !noInstalledAppMatches && !noInstalledApps && !noAppRequests;

	const isFiltered =
		Boolean(text.length) ||
		freePaidFilterStructure.items.find((item) => item.checked)?.id !== 'all' ||
		statusFilterStructure.items.find((item) => item.checked)?.id !== 'all' ||
		sortFilterStructure.items.find((item) => item.checked)?.id !== 'mru' ||
		selectedCategories.length > 0;

	const handleReturn = () => {
		router.navigate({
			name: 'marketplace',
			params: {
				context: 'explore',
				page: 'list',
			},
		});
	};

	const toggleInitialSortOption = useCallback((isRequested: boolean) => {
		setSortFilterStructure((prevState) => {
			prevState.items.forEach((currentItem) => {
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

	return (
		<>
			<AppsFilters
				setText={setText}
				freePaidFilterStructure={freePaidFilterStructure}
				freePaidFilterOnSelected={freePaidFilterOnSelected}
				categories={categories}
				selectedCategories={selectedCategories}
				onSelected={onSelected}
				sortFilterStructure={sortFilterStructure}
				sortFilterOnSelected={sortFilterOnSelected}
				categoryTagList={categoryTagList}
				statusFilterStructure={statusFilterStructure}
				statusFilterOnSelected={statusFilterOnSelected}
				context={context || 'explore'}
			/>
			{appsResult.phase === AsyncStatePhase.LOADING && <AppsPageContentSkeleton />}
			{appsResult.phase === AsyncStatePhase.RESOLVED && noErrorsOcurred && (
				<AppsPageContentBody
					isMarketplace={isMarketplace}
					isFiltered={isFiltered}
					appsResult={appsResult.value}
					itemsPerPage={itemsPerPage}
					current={current}
					onSetItemsPerPage={onSetItemsPerPage}
					onSetCurrent={onSetCurrent}
					paginationProps={paginationProps}
					noErrorsOcurred={noErrorsOcurred}
				/>
			)}
			{noAppRequests && <NoAppRequestsEmptyState />}
			{noMarketplaceOrInstalledAppMatches && (
				<NoMarketplaceOrInstalledAppMatchesEmptyState shouldShowSearchText={appsResult.value.shouldShowSearchText} text={text} />
			)}
			{noInstalledAppMatches && (
				<NoInstalledAppMatchesEmptyState
					shouldShowSearchText={appsResult.value.shouldShowSearchText}
					text={text}
					onButtonClick={handleReturn}
				/>
			)}
			{noInstalledApps && <>{context === 'private' ? <PrivateEmptyState /> : <NoInstalledAppsEmptyState onButtonClick={handleReturn} />}</>}
			{appsResult.phase === AsyncStatePhase.REJECTED && <AppsPageConnectionError onButtonClick={reload} />}
		</>
	);
};

export default AppsPageContent;
