import { Accordion } from '@rocket.chat/fuselage';
import React from 'react';

import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../lib/asyncState/AsyncStatePhase';
import AccordionLoading from './AccordionLoading';
import ReleaseItem from './ReleaseItem';

const AppReleases = ({ id }: { id: string }): JSX.Element => {
	const result = useEndpointData(`/apps/${id}/versions`);

	return (
		<>
			<Accordion width='100%' alignSelf='center'>
				{result.phase === AsyncStatePhase.LOADING && <AccordionLoading />}
				{result.phase === AsyncStatePhase.RESOLVED && (
					<>
						{result.value.apps.map((release) => (
							<ReleaseItem release={release} key={release.version} />
						))}
					</>
				)}
			</Accordion>
		</>
	);
};

export default AppReleases;
