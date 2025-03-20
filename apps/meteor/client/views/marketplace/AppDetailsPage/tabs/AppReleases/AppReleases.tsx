import type { App } from '@rocket.chat/core-typings';
import { Accordion } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import AppReleasesItem from './AppReleasesItem';
import AccordionLoading from '../../../components/AccordionLoading';

const AppReleases = ({ id }: { id: App['id'] }): ReactElement => {
	const getVersions = useEndpoint('GET', '/apps/:id/versions', { id });
	const { t } = useTranslation();

	const { data, isLoading, isFetched } = useQuery({
		queryKey: ['apps', id, 'versions'],
		queryFn: async () => {
			const { apps } = await getVersions();

			if (apps.length === 0) {
				throw new Error(t('No_results_found'));
			}
			return apps;
		},
		meta: {
			apiErrorToastMessage: true,
		},
	});

	return (
		<>
			<Accordion width='100%' alignSelf='center'>
				{isLoading && <AccordionLoading />}
				{isFetched && <>{data?.map((release) => <AppReleasesItem release={release} key={release.version} />)}</>}
			</Accordion>
		</>
	);
};

export default AppReleases;
