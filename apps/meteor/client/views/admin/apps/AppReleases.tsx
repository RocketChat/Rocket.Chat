import { Accordion } from '@rocket.chat/fuselage';
import React, { useEffect, useState } from 'react';

import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../lib/asyncState/AsyncStatePhase';
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
	const { value, phase, error } = useEndpointData(`/apps/${id}/versions`) as any;

	const [releases, setReleases] = useState([] as release[]);

	const isLoading = phase === AsyncStatePhase.LOADING;
	const isSuccess = phase === AsyncStatePhase.RESOLVED;
	const didFail = phase === AsyncStatePhase.REJECTED || error;

	useEffect(() => {
		if (isSuccess && value?.apps) {
			const { apps } = value;

			setReleases(
				apps.map((app: any) => ({
					version: app.version,
					createdDate: app.createdDate,
					detailedChangelog: app.detailedChangelog,
				})),
			);
		}
	}, [isSuccess, value]);

	return (
		<>
			<Accordion width='100%' alignSelf='center'>
				{didFail && error}
				{isLoading && <AccordionLoading />}
				{isSuccess && releases.length && releases.map((release) => <ReleaseItem release={release} key={release.version} />)}
			</Accordion>
		</>
	);
};

export default AppReleases;
