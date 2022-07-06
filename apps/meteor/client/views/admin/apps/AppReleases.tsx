import type { App } from '@rocket.chat/core-typings';
import { Accordion } from '@rocket.chat/fuselage';
import React, { useEffect, useState } from 'react';

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

type value = {
	apps: App[];
	success: boolean;
};

const AppReleases = ({ value, phase }: { value: value; phase: AsyncStatePhase }): JSX.Element => {
	const [releases, setReleases] = useState([] as release[]);

	const isLoading = phase === AsyncStatePhase.LOADING;
	const isSuccess = phase === AsyncStatePhase.RESOLVED;

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
				{isLoading && <AccordionLoading />}
				{isSuccess && releases.length && releases.map((release) => <ReleaseItem release={release} key={release.version} />)}
			</Accordion>
		</>
	);
};

export default AppReleases;
