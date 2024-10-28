import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import AppsPageConnectionError from './AppsPageConnectionError';
import DefaultAppsPageContent from './DefaultAppsPageContent';
import NoAppRequestsEmptyState from './NoAppRequestsEmptyState';
import NoInstalledAppMatchesEmptyState from './NoInstalledAppMatchesEmptyState';
import NoInstalledAppsEmptyState from './NoInstalledAppsEmptyState';
import NoMarketplaceOrInstalledAppMatchesEmptyState from './NoMarketplaceOrInstalledAppMatchesEmptyState';
import PrivateEmptyState from './PrivateEmptyState';
import { useSearchFiltersFormContext } from './SearchFiltersForm';
import SkeletonAppsPageContent from './SkeletonAppsPageContent';
import UnsupportedEmptyState from './UnsupportedEmptyState';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useFilteredAppsQuery } from '../hooks/useFilteredAppsQuery';
import { useMarketplaceContext } from '../hooks/useMarketplaceContext';
import { MarketplaceUnsupportedVersionError } from '../lib/MarketplaceUnsupportedVersionError';

const AppsPageContent = () => {
	const context = useMarketplaceContext();

	const { watch } = useSearchFiltersFormContext();
	const text = useDebouncedValue(watch('text'), 100);
	const [purchaseType, status, categories, sortingMethod] = watch(['purchaseType', 'status', 'categories', 'sortingMethod']);

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const { isLoading, isError, data, error } = useFilteredAppsQuery({
		text,
		purchaseType,
		status,
		categories,
		sortingMethod,
		offset: current,
		count: itemsPerPage,
	});

	if (isLoading) {
		return <SkeletonAppsPageContent />;
	}

	if (isError && error instanceof MarketplaceUnsupportedVersionError) {
		return <UnsupportedEmptyState />;
	}

	if (isError) {
		return <AppsPageConnectionError />;
	}

	if (context === 'requested' && data.count === 0) {
		return <NoAppRequestsEmptyState />;
	}

	if ((context === 'explore' || context === 'premium') && data.count === 0) {
		return <NoMarketplaceOrInstalledAppMatchesEmptyState searchText={text} />;
	}

	if (context === 'installed' && data.totalAppsLength !== 0 && data.count === 0) {
		return <NoInstalledAppMatchesEmptyState searchText={text} />;
	}

	if (context === 'private' && data.totalAppsLength === 0) {
		return <PrivateEmptyState />;
	}

	if (context !== 'explore' && data.totalAppsLength === 0) {
		return <NoInstalledAppsEmptyState />;
	}

	return (
		<DefaultAppsPageContent
			appsResult={data}
			itemsPerPage={itemsPerPage}
			current={current}
			onSetItemsPerPage={onSetItemsPerPage}
			onSetCurrent={onSetCurrent}
			{...paginationProps}
		/>
	);
};

export default AppsPageContent;
