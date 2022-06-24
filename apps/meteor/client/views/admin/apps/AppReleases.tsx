import { Accordion } from '@rocket.chat/fuselage';
import React, { useEffect, useState } from 'react';

import { useEndpointData } from '../../../hooks/useEndpointData';
import AccordionLoading from './AccordionLoading';
import ReleaseItem from './ReleaseItem';

type release = {
	version: string;
	createdDate: string;
	detailedChangelog: {
		raw: string;
		rendered: string;
	};
};

const AppReleases = ({ id }: { id: string }): JSX.Element => {
	const { value } = useEndpointData(`/apps/${id}/versions`);

	const [releases, setReleases] = useState([] as release[]);

	useEffect(() => {
		if (value?.apps) {
			const { apps } = value;

			setReleases(
				apps.map((app) => ({
					version: app.version,
					createdDate: app.createdDate,
					detailedChangelog: app.detailedChangelog,
				})),
			);
		}
	}, [value]);

	return (
		<>
			<Accordion width='100%' alignSelf='center'>
				{!releases.length && <AccordionLoading />}
				{value?.success && releases.map((release) => <ReleaseItem release={release} key={release.version} />)}
			</Accordion>
		</>
	);
};

export default AppReleases;
