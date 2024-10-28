import type { App } from '@rocket.chat/core-typings';
import { Box, Pagination } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { Dispatch, SetStateAction } from 'react';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import AppsList from '../AppsList';
import { useMarketplaceContext } from '../hooks/useMarketplaceContext';
import FeaturedAppsSections from './FeaturedAppsSections';
import { useSearchFiltersFormContext } from './SearchFiltersForm';

type DefaultAppsPageContentProps = {
	items: App[];
	count: number;
	total: number;
	itemsPerPage: 25 | 50 | 100;
	current: number;
	onSetItemsPerPage: Dispatch<SetStateAction<25 | 50 | 100>>;
	onSetCurrent: Dispatch<SetStateAction<number>>;
};

const DefaultAppsPageContent = ({ items, count, total, ...paginationProps }: DefaultAppsPageContentProps) => {
	const { formState } = useSearchFiltersFormContext();
	const context = useMarketplaceContext();
	const { t } = useTranslation();
	const scrollableRef = useRef<HTMLDivElement>(null);
	const appsListId = useUniqueId();

	return (
		<>
			<Box display='flex' flexDirection='column' overflow='hidden' height='100%' pi={24}>
				<Box overflowY='scroll' height='100%' ref={scrollableRef}>
					{context === 'explore' && !formState.isDirty && <FeaturedAppsSections />}
					<AppsList appsListId={appsListId} apps={items} title={context === 'explore' ? t('All_Apps') : undefined} />
				</Box>
			</Box>
			{!!count && (
				<Pagination
					count={total}
					divider
					itemsPerPageLabel={() => t('Items_per_page:')}
					showingResultsLabel={({ count, current, itemsPerPage }) =>
						t('Showing_results_of', { postProcess: 'sprintf', sprintf: [current + 1, Math.min(current + itemsPerPage, count), count] })
					}
					bg='light'
					{...paginationProps}
					onSetCurrent={(value) => {
						paginationProps.onSetCurrent(value);
						scrollableRef.current?.scrollTo(0, 0);
					}}
				/>
			)}
		</>
	);
};

export default DefaultAppsPageContent;
