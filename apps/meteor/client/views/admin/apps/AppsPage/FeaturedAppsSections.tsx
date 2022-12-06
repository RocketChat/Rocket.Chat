import type { App } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import AppsList from '../AppsList';
import normalizeFeaturedApps from '../helpers/normalizeFeaturedApps';
import { useFeaturedApps } from '../hooks/useFeaturedApps';

type FeaturedSectionsProps = {
	appsResult: App[];
};

const FeaturedAppsSections = ({ appsResult }: FeaturedSectionsProps): ReactElement | null => {
	const t = useTranslation();

	const featuredApps = useFeaturedApps();

	if (featuredApps.isSuccess) {
		return (
			<>
				{featuredApps.data.sections.map((section) => (
					<AppsList
						key={section.slug}
						apps={normalizeFeaturedApps(section.apps, appsResult)}
						title={t.has(section.i18nLabel) ? t(section.i18nLabel) : section.i18nLabel}
						isMarketplace={true}
					/>
				))}
			</>
		);
	}

	return null;
};

export default FeaturedAppsSections;
