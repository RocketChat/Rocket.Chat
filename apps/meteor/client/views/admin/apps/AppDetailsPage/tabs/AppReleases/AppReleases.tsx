import type { App } from '@rocket.chat/core-typings';
import { Accordion } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import { useEndpointData } from '../../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../../lib/asyncState/AsyncStatePhase';
import AccordionLoading from '../../../AccordionLoading';
import AppReleasesItem from './AppReleasesItem';

// TODO: replace useEndpointData
const AppReleases = ({ id }: { id: App['id'] }): ReactElement => {
	const result = useEndpointData(`/apps/${id}/versions`);

	return (
		<>
			<Accordion width='100%' alignSelf='center'>
				{result.phase === AsyncStatePhase.LOADING && <AccordionLoading />}
				{result.phase === AsyncStatePhase.RESOLVED && (
					<>
						{result.value.apps.map((release) => (
							<AppReleasesItem release={release} key={release.version} />
						))}
					</>
				)}
			</Accordion>
		</>
	);
};

export default AppReleases;
