import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import React from 'react';
import { useTranslation } from 'react-i18next';

import AppsList from '../AppsList';
import { useFeaturedApps } from '../hooks/useFeaturedApps';

const FeaturedAppsSections = () => {
	const { t, i18n } = useTranslation();
	const { isSuccess, data } = useFeaturedApps();
	const appsListId = useUniqueId();

	if (!isSuccess) {
		return null;
	}

	return (
		<>
			{data.map((section) => (
				<AppsList
					appsListId={`${appsListId}.${section.slug}`}
					key={section.slug}
					apps={section.apps}
					title={i18n.exists(section.i18nLabel) ? t(section.i18nLabel) : section.i18nLabel}
				/>
			))}
		</>
	);
};

export default FeaturedAppsSections;
