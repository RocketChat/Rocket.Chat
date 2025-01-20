import { Box, Throbber } from '@rocket.chat/fuselage';
import { useMethod } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';

function ServersSection(): ReactElement | null {
	const getFederationServers = useMethod('federation:getServers');

	const result = useQuery({
		queryKey: ['admin/federation-dashboard/servers'],
		queryFn: async () => getFederationServers(),
		refetchInterval: 10_000,
	});

	if (result.isPending) {
		return <Throbber alignItems='center' />;
	}

	if (result.isError || result.data.data.length === 0) {
		return null;
	}

	const servers = result.data.data;

	return (
		<Box withRichContent>
			<ul>
				{servers.map(({ domain }) => (
					<li key={domain}>{domain}</li>
				))}
			</ul>
		</Box>
	);
}

export default ServersSection;
