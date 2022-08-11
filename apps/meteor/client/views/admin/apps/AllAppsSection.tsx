import { App } from '@rocket.chat/core-typings';
import { Skeleton } from '@rocket.chat/fuselage';
import { PaginatedResult } from '@rocket.chat/rest-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { AsyncState, AsyncStatePhase } from '../../../lib/asyncState';
import AppsList from './AppsList';

export type AllAppsSectionProps = {
	appsResult: AsyncState<{ items: App[] } & { shouldShowSearchText: boolean } & PaginatedResult>;
	isMarketplace: boolean;
};

const AllAppsSection = ({ appsResult, isMarketplace }: AllAppsSectionProps): ReactElement | null => {
	const t = useTranslation();
	const loadingRows = Array.from({ length: 3 }, (_, i) => <Skeleton key={i} height='x56' mbe='x8' width='100%' variant='rect' />);

	const isAllAppsListReady = appsResult.phase === AsyncStatePhase.RESOLVED && Boolean(appsResult.value.count);

	if (appsResult.phase === AsyncStatePhase.LOADING) {
		return (
			<>
				<Skeleton height='x28' width='x150' mbe='x20' variant='rect' />
				{loadingRows}
			</>
		);
	}

	if (isAllAppsListReady) return <AppsList apps={appsResult.value.items} title={t('All_Apps')} isMarketplace={isMarketplace} />;

	return null;
};

export default AllAppsSection;
