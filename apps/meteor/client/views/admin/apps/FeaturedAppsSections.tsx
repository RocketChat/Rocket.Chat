import { App } from '@rocket.chat/core-typings';
import { Box, Skeleton } from '@rocket.chat/fuselage';
import { PaginatedResult } from '@rocket.chat/rest-typings';
import { TranslationKey, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncState, AsyncStatePhase } from '../../../lib/asyncState';
import AppsList from './AppsList';
import normalizeFeaturedApps from './helpers/normalizeFeaturedApps';

type FeaturedSectionsProps = {
	appsResult: AsyncState<{ items: App[] } & { shouldShowSearchText: boolean } & PaginatedResult>;
	isMarketplace: boolean;
	isFiltered: boolean;
};

const FeaturedAppsSections = ({ appsResult, isMarketplace, isFiltered }: FeaturedSectionsProps): ReactElement | null => {
	const t = useTranslation();
	const featuredApps = useEndpointData('/apps/featured');

	const shouldShowFeaturedSections =
		featuredApps.phase === AsyncStatePhase.RESOLVED &&
		appsResult.phase === AsyncStatePhase.RESOLVED &&
		Boolean(appsResult.value.count) &&
		Boolean(featuredApps.value.sections) &&
		!isFiltered;

	const loadingFeaturedSections = Array.from({ length: 3 }, (_, i) => (
		<Skeleton key={i} height='x56' mbe='x8' width='100%' variant='rect' />
	));

	if (featuredApps.phase === AsyncStatePhase.LOADING) {
		return (
			<>
				<Box mbe='x36'>
					<Skeleton height='x28' width='x150' mbe='x20' variant='rect' />
					{loadingFeaturedSections}
				</Box>
				<Box mbe='x36'>
					<Skeleton height='x28' width='x150' mbe='x20' variant='rect' />
					{loadingFeaturedSections}
				</Box>
			</>
		);
	}

	if (shouldShowFeaturedSections && isMarketplace) {
		return (
			<>
				{featuredApps.value.sections.map((section) => (
					<AppsList
						key={section.slug}
						apps={normalizeFeaturedApps(section.apps, appsResult.value.items)}
						title={t(section.i18nLabel as TranslationKey)}
						isMarketplace={isMarketplace}
						mbe='x36'
					/>
				))}
			</>
		);
	}

	return null;
};

export default FeaturedAppsSections;
