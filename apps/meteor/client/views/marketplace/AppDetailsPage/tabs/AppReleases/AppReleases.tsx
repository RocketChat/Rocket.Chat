import type { App } from '@rocket.chat/core-typings';
import { Accordion } from '@rocket.chat/fuselage';
import React from 'react';

import AppReleasesItem from './AppReleasesItem';
import AccordionLoading from '../../../components/AccordionLoading';
import { useAppVersionsQuery } from '../../../hooks/useAppVersionsQuery';

type AppReleasesProps = {
	appId: App['id'];
};

const AppReleases = ({ appId }: AppReleasesProps) => {
	const { isLoading, isSuccess, data } = useAppVersionsQuery(appId);

	return (
		<>
			<Accordion width='100%' alignSelf='center'>
				{isLoading && <AccordionLoading />}
				{isSuccess && (
					<>
						{data.map((release) => (
							<AppReleasesItem release={release} key={release.version} />
						))}
					</>
				)}
			</Accordion>
		</>
	);
};

export default AppReleases;
