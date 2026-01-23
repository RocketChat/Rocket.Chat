import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { IceServer } from '../definitions';
import { parseStringToIceServers } from '../utils/parseStringToIceServers';

export const useIceServers = (): IceServer[] => {
	const servers = useSetting('VoIP_TeamCollab_Ice_Servers');

	return useMemo(() => {
		if (typeof servers !== 'string' || !servers.trim()) {
			return [];
		}
		return parseStringToIceServers(servers);
	}, [servers]);
};
