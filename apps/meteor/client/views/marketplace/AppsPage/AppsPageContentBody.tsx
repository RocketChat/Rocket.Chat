import type { App } from '@rocket.chat/core-typings';
import { Box, Pagination } from '@rocket.chat/fuselage';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { Dispatch, SetStateAction } from 'react';
import { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import AppsList from '../AppsList';
import FeaturedAppsSections from './FeaturedAppsSections';

type AppsPageContentBodyProps = {
	isMarketplace: boolean;
	isFiltered: boolean;
	appsResult?: PaginatedResult<{
		items: App[];
		shouldShowSearchText: boolean;
		allApps: App[];
		totalAppsLength: number;
	}>;
	itemsPerPage: 25 | 50 | 100;
	current: number;
	onSetItemsPerPage: Dispatch<SetStateAction<25 | 50 | 100>>;
	onSetCurrent: Dispatch<SetStateAction<number>>;
	paginationProps: {
		itemsPerPageLabel: () => string;
		showingResultsLabel: (context: { count: number; current: number; itemsPerPage: 25 | 50 | 100 }) => string;
	};
	noErrorsOcurred: boolean;
};

const AppsPageContentBody = ({
	isMarketplace,
	isFiltered,
	appsResult,
	itemsPerPage,
	current,
	onSetItemsPerPage,
	onSetCurrent,
	paginationProps,
	noErrorsOcurred,
}: AppsPageContentBodyProps) => {
	const { t } = useTranslation();
	const scrollableRef = useRef<HTMLDivElement>(null);
	const appsListId = useId();

	return (
		<>
			<Box display='flex' flexDirection='column' overflow='hidden' height='100%' pi={24}>
				{noErrorsOcurred && (
					<Box overflowY='scroll' height='100%' ref={scrollableRef}>
						{isMarketplace && !isFiltered && <FeaturedAppsSections appsListId={appsListId} appsResult={appsResult?.allApps || []} />}
						<AppsList appsListId={appsListId} apps={appsResult?.items || []} title={isMarketplace ? t('All_Apps') : undefined} />
					</Box>
				)}
			</Box>
			{Boolean(appsResult?.count) && (
				<Pagination
					divider
					current={current}
					itemsPerPage={itemsPerPage}
					count={appsResult?.total || 0}
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
