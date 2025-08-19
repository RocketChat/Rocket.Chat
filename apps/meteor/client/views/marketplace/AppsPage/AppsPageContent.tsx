import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import AppsFilters from './AppsFilters';
import AppsPageConnectionError from './AppsPageConnectionError';
import AppsPageContentBody from './AppsPageContentBody';
import AppsPageContentSkeleton from './AppsPageContentSkeleton';
import NoAppRequestsEmptyState from './NoAppRequestsEmptyState';
import NoInstalledAppMatchesEmptyState from './NoInstalledAppMatchesEmptyState';
import NoInstalledAppsEmptyState from './NoInstalledAppsEmptyState';
import NoMarketplaceOrInstalledAppMatchesEmptyState from './NoMarketplaceOrInstalledAppMatchesEmptyState';
import PrivateEmptyState from './PrivateEmptyState';
import UnsupportedEmptyState from './UnsupportedEmptyState';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useAppsResult } from '../../../contexts/hooks/useAppsResult';
import { AsyncStatePhase } from '../../../lib/asyncState';
import MarketplaceHeader from '../components/MarketplaceHeader';
import type { RadioDropDownGroup } from '../definitions/RadioDropDownDefinitions';
import { useCategories } from '../hooks/useCategories';
import { useFilteredApps } from '../hooks/useFilteredApps';
import type { appsDataType } from '../hooks/useFilteredApps';
import { useRadioToggle } from '../hooks/useRadioToggle';

type AppsContext = 'explore' | 'installed' | 'premium' | 'private' | 'requested';

const AppsPageContent = (): ReactElement => {
	const { t } = useTranslation();
	const { marketplaceApps, installedApps, privateApps, reload } = useAppsResult();
	const [text, setText] = useState('');
	const debouncedText = useDebouncedValue(text, 500);
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const router = useRouter();

	const context = useRouteParameter('context') as AppsContext;

	const isMarketplace = context === 'explore';
	const isPremium = context === 'premium';
	const isRequested = context === 'requested';

	const [freePaidFilterStructure, setFreePaidFilterStructure] = useState({
		label: t('Filter_By_Price'),
		items: [
			{ id: 'all', label: t('All_Prices'), checked: true },
			{ id: 'free', label: t('Free_Apps'), checked: false },
			{ id: 'paid', label: t('Paid_Apps'), checked: false },
			{ id: 'premium', label: t('Premium'), checked: false },
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
		text: debouncedText,
		current,
		itemsPerPage,
		categories: useMemo(() => selectedCategories.map(({ label }) => label), [selectedCategories]),
		purchaseType: useMemo(findPurchaseType, [freePaidFilterStructure]),
		sortingMethod: useMemo(findSort, [sortFilterStructure]),
		status: useMemo(findStatus, [statusFilterStructure]),
		context,
	});

	const noInstalledApps = appsResult.phase === AsyncStatePhase.RESOLVED && !isMarketplace && appsResult.value?.totalAppsLength === 0;

	// TODO: Introduce error codes, so we can avoid using error message strings for this kind of logic
	//       whenever we change the error message, this code ends up breaking.
	const unsupportedVersion =
		appsResult.phase === AsyncStatePhase.REJECTED && appsResult.error.message === 'Marketplace_Unsupported_Version';

	const noMarketplaceOrInstalledAppMatches =
		appsResult.phase === AsyncStatePhase.RESOLVED && (isMarketplace || isPremium) && appsResult.value?.count === 0;

	const noInstalledAppMatches =
		appsResult.phase === AsyncStatePhase.RESOLVED &&
		context === 'installed' &&
		appsResult.value?.totalAppsLength !== 0 &&
		appsResult.value?.count === 0;

	const noAppRequests = context === 'requested' && appsResult?.value?.count === 0;

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

	const getEmptyState = () => {
		if (unsupportedVersion) {
			return <UnsupportedEmptyState />;
		}

		if (noAppRequests) {
			return <NoAppRequestsEmptyState />;
		}

		if (noMarketplaceOrInstalledAppMatches) {
			return <NoMarketplaceOrInstalledAppMatchesEmptyState shouldShowSearchText={!!appsResult.value?.shouldShowSearchText} text={text} />;
		}

		if (noInstalledAppMatches) {
			return (
				<NoInstalledAppMatchesEmptyState
					shouldShowSearchText={!!appsResult.value?.shouldShowSearchText}
					text={text}
					onButtonClick={handleReturn}
				/>
			);
		}

		if (noInstalledApps) {
			return context === 'private' ? <PrivateEmptyState /> : <NoInstalledAppsEmptyState onButtonClick={handleReturn} />;
		}
	};

	return (
		<>
			<MarketplaceHeader unsupportedVersion={unsupportedVersion} title={t(`Apps_context_${context}`)} />
			<AppsFilters
				text={text}
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
			{appsResult.phase === AsyncStatePhase.RESOLVED && noErrorsOcurred && !unsupportedVersion && (
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
			{getEmptyState()}
			{appsResult.phase === AsyncStatePhase.REJECTED && !unsupportedVersion && <AppsPageConnectionError onButtonClick={reload} />}
		</>
	);
};

export default AppsPageContent;
