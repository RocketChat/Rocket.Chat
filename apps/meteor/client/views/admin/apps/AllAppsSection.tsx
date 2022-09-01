import { App } from '@rocket.chat/core-typings';
import { PaginatedResult } from '@rocket.chat/rest-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { AsyncState, AsyncStatePhase } from '../../../lib/asyncState';
import AppsList from './AppsList';

export type AllAppsSectionProps = {
	appsResult: AsyncState<{ items: App[] } & { shouldShowSearchText: boolean } & PaginatedResult>;
	isMarketplace: boolean;
	isAdminSection: boolean;
	currentRouteName: string;
};

const AllAppsSection = ({ appsResult, isMarketplace, isAdminSection, currentRouteName }: AllAppsSectionProps): ReactElement | null => {
	const t = useTranslation();

	const isAllAppsListReady = appsResult.phase === AsyncStatePhase.RESOLVED && Boolean(appsResult.value.count);

	if (isAllAppsListReady)
		return (
			<AppsList
				apps={appsResult.value.items}
				title={t('All_Apps')}
				isMarketplace={isMarketplace}
				isAdminSection={isAdminSection}
				currentRouteName={currentRouteName}
			/>
		);

	return null;
};

export default AllAppsSection;
