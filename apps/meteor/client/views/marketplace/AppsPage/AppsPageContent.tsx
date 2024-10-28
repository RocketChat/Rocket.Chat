import React from 'react';

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
import { useFilteredAppsQuery } from '../hooks/useFilteredAppsQuery';
import { useMarketplaceContext } from '../hooks/useMarketplaceContext';
import { MarketplaceUnsupportedVersionError } from '../lib/MarketplaceUnsupportedVersionError';

const AppsPageContent = () => {
	const context = useMarketplaceContext();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const { isLoading, isError, data, error } = useFilteredAppsQuery({
		offset: current,
		count: itemsPerPage,
	});

	if (isLoading) {
		return <AppsPageContentSkeleton />;
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
		return <NoMarketplaceOrInstalledAppMatchesEmptyState />;
	}

	if (context === 'installed' && data.totalAppsLength !== 0 && data.count === 0) {
		return <NoInstalledAppMatchesEmptyState />;
	}

	if (context === 'private' && data.totalAppsLength === 0) {
		return <PrivateEmptyState />;
	}

	if (context !== 'explore' && data.totalAppsLength === 0) {
		return <NoInstalledAppsEmptyState />;
	}

	return (
		<AppsPageContentBody
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
