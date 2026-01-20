import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { usePagination } from '@rocket.chat/ui-client';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
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
import MarketplaceHeader from '../components/MarketplaceHeader';
import type { RadioDropDownGroup } from '../definitions/RadioDropDownDefinitions';
import { useAppsReload } from '../hooks/useAppsReload';
import { useCategories } from '../hooks/useCategories';
import { useFilteredApps } from '../hooks/useFilteredApps';
import { useRadioToggle } from '../hooks/useRadioToggle';

type AppsContext = 'explore' | 'installed' | 'premium' | 'private' | 'requested';

const AppsPageContent = () => {
	const { t } = useTranslation();
	const reload = useAppsReload();
	const [text, setText] = useState('');
	const debouncedText = useDebouncedValue(text, 500);
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const router = useRouter();

	const context = (useRouteParameter('context') as AppsContext | undefined) ?? 'explore';

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
	const { isPending, isError, error, data } = useFilteredApps({
		text: debouncedText,
		current,
		itemsPerPage,
		categories: useMemo(() => selectedCategories.map(({ label }) => label), [selectedCategories]),
		purchaseType: useMemo(findPurchaseType, [freePaidFilterStructure]),
		sortingMethod: useMemo(findSort, [sortFilterStructure]),
		status: useMemo(findStatus, [statusFilterStructure]),
		context,
	});

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

	if (isPending) {
		return (
			<>
				<MarketplaceHeader unsupportedVersion={false} title={t(`Apps_context_${context}`)} />
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
					context={context}
				/>
				<AppsPageContentSkeleton />
			</>
		);
	}

	if (isError) {
		// TODO: Introduce error codes, so we can avoid using error message strings for this kind of logic
		// whenever we change the error message, this code ends up breaking.
		const unsupportedVersion = error.message === 'Marketplace_Unsupported_Version';

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
					context={context}
				/>
				{unsupportedVersion ? <UnsupportedEmptyState /> : <AppsPageConnectionError onButtonClick={reload} />}
			</>
		);
	}

	return (
		<>
			<MarketplaceHeader unsupportedVersion={false} title={t(`Apps_context_${context}`)} />
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
				context={context}
			/>
			{(context === 'requested' && data.count === 0 && <NoAppRequestsEmptyState />) ||
				((isMarketplace || isPremium) && data.count === 0 && (
					<NoMarketplaceOrInstalledAppMatchesEmptyState shouldShowSearchText={!!data.shouldShowSearchText} text={text} />
				)) ||
				(context === 'installed' && data.totalAppsLength !== 0 && data.count === 0 && (
					<NoInstalledAppMatchesEmptyState shouldShowSearchText={!!data.shouldShowSearchText} text={text} onButtonClick={handleReturn} />
				)) ||
				(context === 'private' && !isMarketplace && data.totalAppsLength === 0 && <PrivateEmptyState />) ||
				(context !== 'private' && !isMarketplace && data.totalAppsLength === 0 && (
					<NoInstalledAppsEmptyState onButtonClick={handleReturn} />
				)) || (
					<AppsPageContentBody
						isMarketplace={isMarketplace}
						isFiltered={isFiltered}
						appsResult={data}
						itemsPerPage={itemsPerPage}
						current={current}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						paginationProps={paginationProps}
					/>
				)}
		</>
	);
};

export default AppsPageContent;
