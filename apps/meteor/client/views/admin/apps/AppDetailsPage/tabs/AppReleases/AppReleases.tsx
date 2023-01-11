import type { App } from '@rocket.chat/core-typings';
import { Accordion } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import AccordionLoading from '../../../AccordionLoading';
import AppReleasesItem from './AppReleasesItem';

// TODO: replace useEndpointData
const AppReleases = ({ id }: { id: App['id'] }): ReactElement => {
	const getVersions = useEndpoint('GET', '/apps/:id/versions', { id });

	const { data, isLoading, isFetched } = useQuery(['apps', id, 'versions'], async () => {
		const versions = await getVersions();
		return versions;
	});

	return (
		<>
			<Accordion width='100%' alignSelf='center'>
				{isLoading && <AccordionLoading />}
				{isFetched && (
					<>
						{data?.apps.map((release) => (
							<AppReleasesItem release={release} key={release.version} />
						))}
					</>
				)}
			</Accordion>
		</>
	);
};

export default AppReleases;
