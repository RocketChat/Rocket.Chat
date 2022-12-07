import { Pagination, Divider } from '@rocket.chat/fuselage';
import { useDebouncedState } from '@rocket.chat/fuselage-hooks';
import { useCurrentRoute, useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo, useState } from 'react';

import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import { useAppsReload, useAppsResult } from '../AppsContext';
import AppsList from '../AppsList';
import type { RadioDropDownGroup } from '../definitions/RadioDropDownDefinitions';
import { useCategories } from '../hooks/useCategories';
import { useFilteredApps } from '../hooks/useFilteredApps';
import { useRadioToggle } from '../hooks/useRadioToggle';
import AppsFilters from './AppsFilters';
import AppsPageConnectionError from './AppsPageConnectionError';
import AppsPageContentSkeleton from './AppsPageContentSkeleton';
import FeaturedAppsSections from './FeaturedAppsSections';
import NoInstalledAppMatchesEmptyState from './NoInstalledAppMatchesEmptyState';
import NoInstalledAppsFoundEmptyState from './NoInstalledAppsFoundEmptyState';
import NoMarketplaceOrInstalledAppMatchesEmptyState from './NoMarketplaceOrInstalledAppMatchesEmptyState';

const AppsPageContent = (): ReactElement => {
	const t = useTranslation();
	const { marketplaceApps, installedApps } = useAppsResult();
	const [text, setText] = useDebouncedState('', 500);
	const reload = useAppsReload();
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const [currentRouteName] = useCurrentRoute();
	if (!currentRouteName) {
		throw new Error('No current route name');
	}
	const router = useRoute(currentRouteName);

	const context = useRouteParameter('context');
	const isMarketplace = context === 'all';

	const [freePaidFilterStructure, setFreePaidFilterStructure] = useState({
		label: t('Filter_By_Price'),
		items: [
			{ id: 'all', label: t('All_Prices'), checked: true },
			{ id: 'free', label: t('Free_Apps'), checked: false },
			{ id: 'paid', label: t('Paid_Apps'), checked: false },
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

	const [sortFilterStructure, setSortFilterStructure] = useState<RadioDropDownGroup>({
		label: t('Sort_By'),
		items: [
			{ id: 'mru', label: t('Most_recent_updated'), checked: true },
			{ id: 'lru', label: t('Least_recent_updated'), checked: false },
			{ id: 'az', label: 'A-Z', checked: false },
			{ id: 'za', label: 'Z-A', checked: false },
		],
	});
	const sortFilterOnSelected = useRadioToggle(setSortFilterStructure);

	const [categories, selectedCategories, categoryTagList, onSelected] = useCategories();
	const appsResult = useFilteredApps({
		appsData: isMarketplace ? marketplaceApps : installedApps,
		text,
		current,
		itemsPerPage,
		categories: useMemo(() => selectedCategories.map(({ label }) => label), [selectedCategories]),
		purchaseType: useMemo(() => freePaidFilterStructure.items.find(({ checked }) => checked)?.id, [freePaidFilterStructure]),
		sortingMethod: useMemo(() => sortFilterStructure.items.find(({ checked }) => checked)?.id, [sortFilterStructure]),
		status: useMemo(() => statusFilterStructure.items.find(({ checked }) => checked)?.id, [statusFilterStructure]),
	});

	const noInstalledAppsFound = appsResult.phase === AsyncStatePhase.RESOLVED && !isMarketplace && appsResult.value.total === 0;

	const noMarketplaceOrInstalledAppMatches = appsResult.phase === AsyncStatePhase.RESOLVED && isMarketplace && appsResult.value.count === 0;

	const noInstalledAppMatches =
		appsResult.phase === AsyncStatePhase.RESOLVED && !isMarketplace && appsResult.value.total !== 0 && appsResult.value.count === 0;

	const isFiltered =
		Boolean(text.length) ||
		freePaidFilterStructure.items.find((item) => item.checked)?.id !== 'all' ||
		statusFilterStructure.items.find((item) => item.checked)?.id !== 'all' ||
		sortFilterStructure.items.find((item) => item.checked)?.id !== 'mru' ||
		selectedCategories.length > 0;

	const handleReturn = (): void => {
		router.push({ context: 'all', page: 'list' });
	};

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
			/>
			{appsResult.phase === AsyncStatePhase.LOADING && <AppsPageContentSkeleton />}

			{appsResult.phase === AsyncStatePhase.RESOLVED &&
				!noMarketplaceOrInstalledAppMatches &&
				(!noInstalledAppMatches || !noInstalledAppsFound) && (
					<>
						{isMarketplace && !isFiltered && <FeaturedAppsSections appsResult={appsResult.value.allApps} />}
						{!noInstalledAppsFound && <AppsList apps={appsResult.value.items} title={t('All_Apps')} isMarketplace={isMarketplace} />}
						{Boolean(appsResult.value.count) && (
							<>
								<Divider />
								<Pagination
									current={current}
									itemsPerPage={itemsPerPage}
									count={appsResult.value.total}
									onSetItemsPerPage={onSetItemsPerPage}
									onSetCurrent={onSetCurrent}
									{...paginationProps}
								/>
							</>
						)}
					</>
				)}
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
			{noInstalledAppsFound && <NoInstalledAppsFoundEmptyState onButtonClick={handleReturn} />}
			{appsResult.phase === AsyncStatePhase.REJECTED && <AppsPageConnectionError onButtonClick={reload} />}
		</>
	);
};

export default AppsPageContent;
