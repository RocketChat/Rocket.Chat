import type { App } from '@rocket.chat/core-typings';
import { Box, Pagination } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { Dispatch, SetStateAction } from 'react';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import AppsList from '../AppsList';
import { useMarketplaceContext } from '../hooks/useMarketplaceContext';
import FeaturedAppsSections from './FeaturedAppsSections';
import { useSearchFiltersFormContext } from './SearchFiltersForm';

type AppsPageContentBodyProps = {
	appsResult: PaginatedResult<{
		items: App[];
		shouldShowSearchText: boolean;
		allApps: App[];
		totalAppsLength: number;
	}>;
	itemsPerPage: 25 | 50 | 100;
	current: number;
	onSetItemsPerPage: Dispatch<SetStateAction<25 | 50 | 100>>;
	onSetCurrent: Dispatch<SetStateAction<number>>;
	itemsPerPageLabel: () => string;
	showingResultsLabel: (context: { count: number; current: number; itemsPerPage: 25 | 50 | 100 }) => string;
};

const AppsPageContentBody = ({
	appsResult,
	itemsPerPage,
	current,
	onSetItemsPerPage,
	onSetCurrent,
	...paginationProps
}: AppsPageContentBodyProps) => {
	const { formState } = useSearchFiltersFormContext();
	const context = useMarketplaceContext();
	const { t } = useTranslation();
	const scrollableRef = useRef<HTMLDivElement>(null);
	const appsListId = useUniqueId();

	return (
		<>
			<Box display='flex' flexDirection='column' overflow='hidden' height='100%' pi={24}>
				<Box overflowY='scroll' height='100%' ref={scrollableRef}>
					{context === 'explore' && !formState.isDirty && <FeaturedAppsSections appsListId={appsListId} appsResult={appsResult.allApps} />}
					<AppsList appsListId={appsListId} apps={appsResult.items} title={context === 'explore' ? t('All_Apps') : undefined} />
				</Box>
			</Box>
			{!!appsResult.count && (
				<Pagination
					divider
					current={current}
					itemsPerPage={itemsPerPage}
					count={appsResult.total}
					onSetItemsPerPage={onSetItemsPerPage}
					onSetCurrent={(value) => {
						onSetCurrent(value);
						scrollableRef.current?.scrollTo(0, 0);
					}}
					bg='light'
					{...paginationProps}
				/>
			)}
		</>
	);
};

export default AppsPageContentBody;
