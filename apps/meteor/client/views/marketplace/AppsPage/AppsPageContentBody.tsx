import type { App } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { RefObject } from 'react';
import React from 'react';
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
	scrollableRef: RefObject<HTMLDivElement>;
};

const AppsPageContentBody = ({ isMarketplace, isFiltered, appsResult, scrollableRef }: AppsPageContentBodyProps) => {
	const { t } = useTranslation();
	const appsListId = useUniqueId();

	return (
		<Box overflowY='scroll' height='100%' ref={scrollableRef}>
			{isMarketplace && !isFiltered && <FeaturedAppsSections appsListId={appsListId} appsResult={appsResult?.allApps || []} />}
			<AppsList appsListId={appsListId} apps={appsResult?.items || []} title={isMarketplace ? t('All_Apps') : undefined} />
		</Box>
	);
};

export default AppsPageContentBody;
