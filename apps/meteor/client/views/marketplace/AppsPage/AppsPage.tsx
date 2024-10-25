import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedState } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { Page } from '../../../components/Page';
import { useAppsResult } from '../../../contexts/hooks/useAppsResult';
import { AsyncStatePhase } from '../../../lib/asyncState';
import MarketplaceHeader from '../components/MarketplaceHeader';
import type { RadioDropDownGroup } from '../definitions/RadioDropDownDefinitions';
import { useCategories } from '../hooks/useCategories';
import type { appsDataType } from '../hooks/useFilteredApps';
import { useFilteredApps } from '../hooks/useFilteredApps';
import { useRadioToggle } from '../hooks/useRadioToggle';
import AppsFilters from './AppsFilters';
import AppsPageContent from './AppsPageContent';

type AppsContext = 'explore' | 'installed' | 'premium' | 'private' | 'requested';

const AppsPage = (): ReactElement => {
	const { t } = useTranslation();
	const { marketplaceApps, installedApps, privateApps, reload } = useAppsResult();
	const [text, setText] = useDebouncedState('', 500);
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const scrollableRef = useRef<HTMLDivElement>(null);

	const context = useRouteParameter('context') as AppsContext;

	const isMarketplace = context === 'explore';
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
		text,
		current,
		itemsPerPage,
		categories: useMemo(() => selectedCategories.map(({ label }) => label), [selectedCategories]),
		purchaseType: useMemo(findPurchaseType, [freePaidFilterStructure]),
		sortingMethod: useMemo(findSort, [sortFilterStructure]),
		status: useMemo(findStatus, [statusFilterStructure]),
		context,
	});

	const unsupportedVersion = appsResult.phase === AsyncStatePhase.REJECTED && appsResult.error.message === 'unsupported version';

	const isFiltered =
		Boolean(text.length) ||
		freePaidFilterStructure.items.find((item) => item.checked)?.id !== 'all' ||
		statusFilterStructure.items.find((item) => item.checked)?.id !== 'all' ||
		sortFilterStructure.items.find((item) => item.checked)?.id !== 'mru' ||
		selectedCategories.length > 0;

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
		<Page background='tint'>
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
			<AppsPageContent
				reload={reload}
				isMarketplace={isMarketplace}
				isFiltered={isFiltered}
				appsResult={appsResult}
				scrollableRef={scrollableRef}
				unsupportedVersion={unsupportedVersion}
				text={text}
				context={context}
			/>
			{Boolean(appsResult.value?.count) && (
				<Pagination
					divider
					current={current}
					itemsPerPage={itemsPerPage}
					count={appsResult.value?.total || 0}
					onSetItemsPerPage={onSetItemsPerPage}
					onSetCurrent={(value) => {
						onSetCurrent(value);
						scrollableRef.current?.scrollTo(0, 0);
					}}
					bg='light'
					{...paginationProps}
				/>
			)}
		</Page>
	);
};

export default AppsPage;
