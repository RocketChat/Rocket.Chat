import { Box, Throbber } from '@rocket.chat/fuselage';
import React from 'react';

import { usePolledMethodData, AsyncState } from '../../contexts/ServerContext';

function ServersSection() {
	const [serversData, serversStatus] = usePolledMethodData('federation:getServers', [], 10000);

	if (serversStatus === AsyncState.LOADING) {
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
