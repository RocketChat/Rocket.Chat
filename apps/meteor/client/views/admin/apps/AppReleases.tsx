import type { Serialized } from '@rocket.chat/core-typings';
import { Accordion } from '@rocket.chat/fuselage';
import { MatchPathPattern, OperationResult } from '@rocket.chat/rest-typings';
import React from 'react';

import { AsyncState } from '../../../lib/asyncState';
import { AsyncStatePhase } from '../../../lib/asyncState/AsyncStatePhase';
import AccordionLoading from './AccordionLoading';
import ReleaseItem from './ReleaseItem';

const AppReleases = ({
	result,
}: {
	result: AsyncState<Serialized<OperationResult<'GET', MatchPathPattern<`/apps/${string}/versions`>>>> & {
		reload: () => void;
	};
}): JSX.Element => (
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

export default AppReleases;
