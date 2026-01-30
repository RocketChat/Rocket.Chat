import type { App } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import AppsList from '../AppsList';
import normalizeFeaturedApps from '../helpers/normalizeFeaturedApps';
import { useFeaturedApps } from '../hooks/useFeaturedApps';

type FeaturedSectionsProps = {
	appsResult: App[];
	appsListId: string;
};

const FeaturedAppsSections = ({ appsResult, appsListId }: FeaturedSectionsProps): ReactElement | null => {
	const { t, i18n } = useTranslation();
	const featuredApps = useFeaturedApps();

	if (featuredApps.isSuccess) {
		return (
			<>
				{featuredApps.data.sections.map((section, index) => (
					<AppsList
						appsListId={`${appsListId + index}`}
						key={section.slug}
						apps={normalizeFeaturedApps(section.apps, appsResult)}
						title={i18n.exists(section.i18nLabel) ? t(section.i18nLabel) : section.i18nLabel}
					/>
				))}
			</>
		);
	}

	return null;
};

export default FeaturedAppsSections;
