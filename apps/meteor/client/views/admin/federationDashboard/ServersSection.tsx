import type { IFederationServer } from '@rocket.chat/core-typings';
import { Box, Throbber } from '@rocket.chat/fuselage';
import React, { useMemo, ReactElement } from 'react';

import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { usePolledMethodData } from '../../../hooks/usePolledMethodData';

type FederationServer = { value: { data: IFederationServer[] } | undefined; phase: AsyncStatePhase };

function ServersSection(): ReactElement | null {
	const { value: serversData, phase: serversStatus }: FederationServer = usePolledMethodData(
		'federation:getServers',
		useMemo(() => [], []),
		10000,
	);

	if (serversStatus === AsyncStatePhase.LOADING) {
		return <Throbber alignItems='center' />;
	}

	if (serversData?.data?.length === 0) {
		return null;
	}

	return (
		<Box withRichContent>
			<ul>
				{serversData?.data?.map(({ domain }) => (
					<li key={domain}>{domain}</li>
				))}
			</ul>
		</Box>
	);
}

export default ServersSection;
