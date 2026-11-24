import type { App } from '@rocket.chat/core-typings';
import { Pagination, Stack } from '@rocket.chat/fuselage';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import { CustomScrollbars } from '@rocket.chat/ui-client';
import type { Dispatch, SetStateAction } from 'react';
import { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import AppsList from '../AppsList';
import FeaturedAppsSections from './FeaturedAppsSections';
import ListViewport from '../../../components/ListViewport';

export type AppsPageContentBodyProps = {
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
}: AppsPageContentBodyProps) => {
	const { t } = useTranslation();
	const scrollableRef = useRef<HTMLElement>(null);
	const appsListId = useId();

	return (
		<>
			<ListViewport>
				<CustomScrollbars ref={scrollableRef}>
					<Stack gap='x16'>
						{isMarketplace && !isFiltered && <FeaturedAppsSections appsListId={appsListId} appsResult={appsResult?.allApps || []} />}
						<AppsList appsListId={appsListId} apps={appsResult?.items || []} title={isMarketplace ? t('All_Apps') : undefined} />
					</Stack>
				</CustomScrollbars>
			</ListViewport>
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
					{...paginationProps}
				/>
			)}
		</>
	);
};

export default AppsPageContentBody;
