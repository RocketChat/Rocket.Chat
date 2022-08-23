import { App } from '@rocket.chat/core-typings';
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
	const featuredApps = useEndpointData('/apps/featured-apps');

	const shouldShowFeaturedSections =
		featuredApps.phase === AsyncStatePhase.RESOLVED &&
		appsResult.phase === AsyncStatePhase.RESOLVED &&
		Boolean(appsResult.value.count) &&
		Boolean(featuredApps.value.sections) &&
		!isFiltered;

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
