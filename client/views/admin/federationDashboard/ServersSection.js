import { Box, Throbber } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { usePolledMethodData } from '../../../contexts/ServerContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';

function ServersSection() {
	const { value: serversData, phase: serversStatus } = usePolledMethodData('federation:getServers', useMemo(() => [], []), 10000);

	if (serversStatus === AsyncStatePhase.LOADING) {
		return <Throbber align='center' />;
	}

	if (serversData?.data?.length === 0) {
		return null;
	}

	return <Box withRichContent>
		<ul>
			{serversData?.data?.map(({ domain }) => (
				<li key={domain}>{domain}</li>
			))}
		</ul>
	</Box>;
}

export default ServersSection;
